/*! WebUploader 1.0.0 */


/**
 * @fileOverview 让内部各个部件的代码可以用[amd](https://github.com/amdjs/amdjs-api/wiki/AMD)模块定义方式组织起来。
 *
 * AMD API 内部的简单不完全实现，请忽略。只有当WebUploader被合并成一个文件的时候才会引入。
 */
(function( root, factory ) {
    var modules = {},

        // 内部require, 简单不完全实现。
        // https://github.com/amdjs/amdjs-api/wiki/require
        _require = function( deps, callback ) {
            var args, len, i;

            // 如果deps不是数组，则直接返回指定module
            if ( typeof deps === 'string' ) {
                return getModule( deps );
            } else {
                args = [];
                for( len = deps.length, i = 0; i < len; i++ ) {
                    args.push( getModule( deps[ i ] ) );
                }

                return callback.apply( null, args );
            }
        },

        // 内部define，暂时不支持不指定id.
        _define = function( id, deps, factory ) {
            if ( arguments.length === 2 ) {
                factory = deps;
                deps = null;
            }

            _require( deps || [], function() {
                setModule( id, factory, arguments );
            });
        },

        // 设置module, 兼容CommonJs写法。
        setModule = function( id, factory, args ) {
            var module = {
                    exports: factory
                },
                returned;

            if ( typeof factory === 'function' ) {
                args.length || (args = [ _require, module.exports, module ]);
                returned = factory.apply( null, args );
                returned !== undefined && (module.exports = returned);
            }

            modules[ id ] = module.exports;
        },

        // 根据id获取module
        getModule = function( id ) {
            var module = modules[ id ] || root[ id ];

            if ( !module ) {
                throw new Error( '`' + id + '` is undefined' );
            }

            return module;
        },

        // 将所有modules，将路径ids装换成对象。
        exportsTo = function( obj ) {
            var key, host, parts, part, last, ucFirst;

            // make the first character upper case.
            ucFirst = function( str ) {
                return str && (str.charAt( 0 ).toUpperCase() + str.substr( 1 ));
            };

            for ( key in modules ) {
                host = obj;

                if ( !modules.hasOwnProperty( key ) ) {
                    continue;
                }

                parts = key.split('/');
                last = ucFirst( parts.pop() );

                while( (part = ucFirst( parts.shift() )) ) {
                    host[ part ] = host[ part ] || {};
                    host = host[ part ];
                }

                host[ last ] = modules[ key ];
            }

            return obj;
        },

        makeExport = function( dollar ) {
            root.__dollar = dollar;

            // exports every module.
            return exportsTo( factory( root, _define, _require ) );
        },

        origin;

    if ( typeof module === 'object' && typeof module.exports === 'object' ) {

        // For CommonJS and CommonJS-like environments where a proper window is present,
        module.exports = makeExport();
    } else if ( typeof define === 'function' && define.amd ) {

        // Allow using this built library as an AMD module
        // in another project. That other project will only
        // see this AMD call, not the internal modules in
        // the closure below.
        define([ 'jquery' ], makeExport );
    } else {

        // Browser globals case. Just assign the
        // result to a property on the global.
        origin = root.WebUploader;
        root.WebUploader = makeExport();
        root.WebUploader.noConflict = function() {
            root.WebUploader = origin;
        };
    }
})( window, function( window, define, require ) {


    /**
     * @fileOverview jQuery or Zepto
     * @require "jquery"
     * @require "zepto"
     */
    define('dollar-third',[],function() {
        var req = window.require;
        var $ = window.__dollar || 
            window.jQuery || 
            window.Zepto || 
            req('jquery') || 
            req('zepto');
    
        if ( !$ ) {
            throw new Error('jQuery or Zepto not found!');
        }
    
        return $;
    });
    
    /**
     * @fileOverview Dom 操作相关
     */
    define('dollar',[
        'dollar-third'
    ], function( _ ) {
        return _;
    });
    /**
     * @fileOverview 使用jQuery的Promise
     */
    define('promise-third',[
        'dollar'
    ], function( $ ) {
        return {
            Deferred: $.Deferred,
            when: $.when,
    
            isPromise: function( anything ) {
                return anything && typeof anything.then === 'function';
            }
        };
    });
    /**
     * @fileOverview Promise/A+
     */
    define('promise',[
        'promise-third'
    ], function( _ ) {
        return _;
    });
    /**
     * @fileOverview 基础类方法。
     */
    
    /**
     * Web Uploader内部类的详细说明，以下提及的功能类，都可以在`WebUploader`这个变量中访问到。
     *
     * As you know, Web Uploader的每个文件都是用过[AMD](https://github.com/amdjs/amdjs-api/wiki/AMD)规范中的`define`组织起来的, 每个Module都会有个module id.
     * 默认module id为该文件的路径，而此路径将会转化成名字空间存放在WebUploader中。如：
     *
     * * module `base`：WebUploader.Base
     * * module `file`: WebUploader.File
     * * module `lib/dnd`: WebUploader.Lib.Dnd
     * * module `runtime/html5/dnd`: WebUploader.Runtime.Html5.Dnd
     *
     *
     * 以下文档中对类的使用可能省略掉了`WebUploader`前缀。
     * @module WebUploader
     * @title WebUploader API文档
     */
    define('base',[
        'dollar',
        'promise'
    ], function( $, promise ) {
    
        var noop = function() {},
            call = Function.call;
    
        // http://jsperf.com/uncurrythis
        // 反科里化
        function uncurryThis( fn ) {
            return function() {
                return call.apply( fn, arguments );
            };
        }
    
        function bindFn( fn, context ) {
            return function() {
                return fn.apply( context, arguments );
            };
        }
    
        function createObject( proto ) {
            var f;
    
            if ( Object.create ) {
                return Object.create( proto );
            } else {
                f = function() {};
                f.prototype = proto;
                return new f();
            }
        }
    
    
        /**
         * 基础类，提供一些简单常用的方法。
         * @class Base
         */
        return {
    
            /**
             * @property {String} version 当前版本号。
             */
            version: '1.0.0',
    
            /**
             * @property {jQuery|Zepto} $ 引用依赖的jQuery或者Zepto对象。
             */
            $: $,
    
            Deferred: promise.Deferred,
    
            isPromise: promise.isPromise,
    
            when: promise.when,
    
            /**
             * @description  简单的浏览器检查结果。
             *
             * * `webkit`  webkit版本号，如果浏览器为非webkit内核，此属性为`undefined`。
             * * `chrome`  chrome浏览器版本号，如果浏览器为chrome，此属性为`undefined`。
             * * `ie`  ie浏览器版本号，如果浏览器为非ie，此属性为`undefined`。**暂不支持ie10+**
             * * `firefox`  firefox浏览器版本号，如果浏览器为非firefox，此属性为`undefined`。
             * * `safari`  safari浏览器版本号，如果浏览器为非safari，此属性为`undefined`。
             * * `opera`  opera浏览器版本号，如果浏览器为非opera，此属性为`undefined`。
             *
             * @property {Object} [browser]
             */
            browser: (function( ua ) {
                var ret = {},
                    webkit = ua.match( /WebKit\/([\d.]+)/ ),
                    chrome = ua.match( /Chrome\/([\d.]+)/ ) ||
                        ua.match( /CriOS\/([\d.]+)/ ),
    
                    ie = ua.match( /MSIE\s([\d\.]+)/ ) ||
                        ua.match( /(?:trident)(?:.*rv:([\w.]+))?/i ),
                    firefox = ua.match( /Firefox\/([\d.]+)/ ),
                    safari = ua.match( /Safari\/([\d.]+)/ ),
                    opera = ua.match( /OPR\/([\d.]+)/ );
    
                webkit && (ret.webkit = parseFloat( webkit[ 1 ] ));
                chrome && (ret.chrome = parseFloat( chrome[ 1 ] ));
                ie && (ret.ie = parseFloat( ie[ 1 ] ));
                firefox && (ret.firefox = parseFloat( firefox[ 1 ] ));
                safari && (ret.safari = parseFloat( safari[ 1 ] ));
                opera && (ret.opera = parseFloat( opera[ 1 ] ));
    
                return ret;
            })( navigator.userAgent ),
    
            /**
             * @description  操作系统检查结果。
             *
             * * `android`  如果在android浏览器环境下，此值为对应的android版本号，否则为`undefined`。
             * * `ios` 如果在ios浏览器环境下，此值为对应的ios版本号，否则为`undefined`。
             * @property {Object} [os]
             */
            os: (function( ua ) {
                var ret = {},
    
                    // osx = !!ua.match( /\(Macintosh\; Intel / ),
                    android = ua.match( /(?:Android);?[\s\/]+([\d.]+)?/ ),
                    ios = ua.match( /(?:iPad|iPod|iPhone).*OS\s([\d_]+)/ );
    
                // osx && (ret.osx = true);
                android && (ret.android = parseFloat( android[ 1 ] ));
                ios && (ret.ios = parseFloat( ios[ 1 ].replace( /_/g, '.' ) ));
    
                return ret;
            })( navigator.userAgent ),
    
            /**
             * 实现类与类之间的继承。
             * @method inherits
             * @grammar Base.inherits( super ) => child
             * @grammar Base.inherits( super, protos ) => child
             * @grammar Base.inherits( super, protos, statics ) => child
             * @param  {Class} super 父类
             * @param  {Object | Function} [protos] 子类或者对象。如果对象中包含constructor，子类将是用此属性值。
             * @param  {Function} [protos.constructor] 子类构造器，不指定的话将创建个临时的直接执行父类构造器的方法。
             * @param  {Object} [statics] 静态属性或方法。
             * @return {Class} 返回子类。
             * @example
             * function Person() {
             *     console.log( 'Super' );
             * }
             * Person.prototype.hello = function() {
             *     console.log( 'hello' );
             * };
             *
             * var Manager = Base.inherits( Person, {
             *     world: function() {
             *         console.log( 'World' );
             *     }
             * });
             *
             * // 因为没有指定构造器，父类的构造器将会执行。
             * var instance = new Manager();    // => Super
             *
             * // 继承子父类的方法
             * instance.hello();    // => hello
             * instance.world();    // => World
             *
             * // 子类的__super__属性指向父类
             * console.log( Manager.__super__ === Person );    // => true
             */
            inherits: function( Super, protos, staticProtos ) {
                var child;
    
                if ( typeof protos === 'function' ) {
                    child = protos;
                    protos = null;
                } else if ( protos && protos.hasOwnProperty('constructor') ) {
                    child = protos.constructor;
                } else {
                    child = function() {
                        return Super.apply( this, arguments );
                    };
                }
    
                // 复制静态方法
                $.extend( true, child, Super, staticProtos || {} );
    
                /* jshint camelcase: false */
    
                // 让子类的__super__属性指向父类。
                child.__super__ = Super.prototype;
    
                // 构建原型，添加原型方法或属性。
                // 暂时用Object.create实现。
                child.prototype = createObject( Super.prototype );
                protos && $.extend( true, child.prototype, protos );
    
                return child;
            },
    
            /**
             * 一个不做任何事情的方法。可以用来赋值给默认的callback.
             * @method noop
             */
            noop: noop,
    
            /**
             * 返回一个新的方法，此方法将已指定的`context`来执行。
             * @grammar Base.bindFn( fn, context ) => Function
             * @method bindFn
             * @example
             * var doSomething = function() {
             *         console.log( this.name );
             *     },
             *     obj = {
             *         name: 'Object Name'
             *     },
             *     aliasFn = Base.bind( doSomething, obj );
             *
             *  aliasFn();    // => Object Name
             *
             */
            bindFn: bindFn,
    
            /**
             * 引用Console.log如果存在的话，否则引用一个[空函数noop](#WebUploader:Base.noop)。
             * @grammar Base.log( args... ) => undefined
             * @method log
             */
            log: (function() {
                if ( window.console ) {
                    return bindFn( console.log, console );
                }
                return noop;
            })(),
    
            nextTick: (function() {
    
                return function( cb ) {
                    setTimeout( cb, 1 );
                };
    
                // @bug 当浏览器不在当前窗口时就停了。
                // var next = window.requestAnimationFrame ||
                //     window.webkitRequestAnimationFrame ||
                //     window.mozRequestAnimationFrame ||
                //     function( cb ) {
                //         window.setTimeout( cb, 1000 / 60 );
                //     };
    
                // // fix: Uncaught TypeError: Illegal invocation
                // return bindFn( next, window );
            })(),
    
            /**
             * 被[uncurrythis](http://www.2ality.com/2011/11/uncurrying-this.html)的数组slice方法。
             * 将用来将非数组对象转化成数组对象。
             * @grammar Base.slice( target, start[, end] ) => Array
             * @method slice
             * @example
             * function doSomthing() {
             *     var args = Base.slice( arguments, 1 );
             *     console.log( args );
             * }
             *
             * doSomthing( 'ignored', 'arg2', 'arg3' );    // => Array ["arg2", "arg3"]
             */
            slice: uncurryThis( [].slice ),
    
            /**
             * 生成唯一的ID
             * @method guid
             * @grammar Base.guid() => String
             * @grammar Base.guid( prefx ) => String
             */
            guid: (function() {
                var counter = 0;
    
                return function( prefix ) {
                    var guid = (+new Date()).toString( 32 ),
                        i = 0;
    
                    for ( ; i < 5; i++ ) {
                        guid += Math.floor( Math.random() * 65535 ).toString( 32 );
                    }
    
                    return (prefix || 'wu_') + guid + (counter++).toString( 32 );
                };
            })(),
    
            /**
             * 格式化文件大小, 输出成带单位的字符串
             * @method formatSize
             * @grammar Base.formatSize( size ) => String
             * @grammar Base.formatSize( size, pointLength ) => String
             * @grammar Base.formatSize( size, pointLength, units ) => String
             * @param {Number} size 文件大小
             * @param {Number} [pointLength=2] 精确到的小数点数。
             * @param {Array} [units=[ 'B', 'K', 'M', 'G', 'TB' ]] 单位数组。从字节，到千字节，一直往上指定。如果单位数组里面只指定了到了K(千字节)，同时文件大小大于M, 此方法的输出将还是显示成多少K.
             * @example
             * console.log( Base.formatSize( 100 ) );    // => 100B
             * console.log( Base.formatSize( 1024 ) );    // => 1.00K
             * console.log( Base.formatSize( 1024, 0 ) );    // => 1K
             * console.log( Base.formatSize( 1024 * 1024 ) );    // => 1.00M
             * console.log( Base.formatSize( 1024 * 1024 * 1024 ) );    // => 1.00G
             * console.log( Base.formatSize( 1024 * 1024 * 1024, 0, ['B', 'KB', 'MB'] ) );    // => 1024MB
             */
            formatSize: function( size, pointLength, units ) {
                var unit;
    
                units = units || [ 'B', 'K', 'M', 'G', 'TB' ];
    
                while ( (unit = units.shift()) && size > 1024 ) {
                    size = size / 1024;
                }
    
                return (unit === 'B' ? size : size.toFixed( pointLength || 2 )) +
                        unit;
            }
        };
    });
    /**
     * 事件处理类，可以独立使用，也可以扩展给对象使用。
     * @fileOverview Mediator
     */
    define('mediator',[
        'base'
    ], function( Base ) {
        var $ = Base.$,
            slice = [].slice,
            separator = /\s+/,
            protos;
    
        // 根据条件过滤出事件handlers.
        function findHandlers( arr, name, callback, context ) {
            return $.grep( arr, function( handler ) {
                return handler &&
                        (!name || handler.e === name) &&
                        (!callback || handler.cb === callback ||
                        handler.cb._cb === callback) &&
                        (!context || handler.ctx === context);
            });
        }
    
        function eachEvent( events, callback, iterator ) {
            // 不支持对象，只支持多个event用空格隔开
            $.each( (events || '').split( separator ), function( _, key ) {
                iterator( key, callback );
            });
        }
    
        function triggerHanders( events, args ) {
            var stoped = false,
                i = -1,
                len = events.length,
                handler;
    
            while ( ++i < len ) {
                handler = events[ i ];
    
                if ( handler.cb.apply( handler.ctx2, args ) === false ) {
                    stoped = true;
                    break;
                }
            }
    
            return !stoped;
        }
    
        protos = {
    
            /**
             * 绑定事件。
             *
             * `callback`方法在执行时，arguments将会来源于trigger的时候携带的参数。如
             * ```javascript
             * var obj = {};
             *
             * // 使得obj有事件行为
             * Mediator.installTo( obj );
             *
             * obj.on( 'testa', function( arg1, arg2 ) {
             *     console.log( arg1, arg2 ); // => 'arg1', 'arg2'
             * });
             *
             * obj.trigger( 'testa', 'arg1', 'arg2' );
             * ```
             *
             * 如果`callback`中，某一个方法`return false`了，则后续的其他`callback`都不会被执行到。
             * 切会影响到`trigger`方法的返回值，为`false`。
             *
             * `on`还可以用来添加一个特殊事件`all`, 这样所有的事件触发都会响应到。同时此类`callback`中的arguments有一个不同处，
             * 就是第一个参数为`type`，记录当前是什么事件在触发。此类`callback`的优先级比脚低，会再正常`callback`执行完后触发。
             * ```javascript
             * obj.on( 'all', function( type, arg1, arg2 ) {
             *     console.log( type, arg1, arg2 ); // => 'testa', 'arg1', 'arg2'
             * });
             * ```
             *
             * @method on
             * @grammar on( name, callback[, context] ) => self
             * @param  {String}   name     事件名，支持多个事件用空格隔开
             * @param  {Function} callback 事件处理器
             * @param  {Object}   [context]  事件处理器的上下文。
             * @return {self} 返回自身，方便链式
             * @chainable
             * @class Mediator
             */
            on: function( name, callback, context ) {
                var me = this,
                    set;
    
                if ( !callback ) {
                    return this;
                }
    
                set = this._events || (this._events = []);
    
                eachEvent( name, callback, function( name, callback ) {
                    var handler = { e: name };
    
                    handler.cb = callback;
                    handler.ctx = context;
                    handler.ctx2 = context || me;
                    handler.id = set.length;
    
                    set.push( handler );
                });
    
                return this;
            },
    
            /**
             * 绑定事件，且当handler执行完后，自动解除绑定。
             * @method once
             * @grammar once( name, callback[, context] ) => self
             * @param  {String}   name     事件名
             * @param  {Function} callback 事件处理器
             * @param  {Object}   [context]  事件处理器的上下文。
             * @return {self} 返回自身，方便链式
             * @chainable
             */
            once: function( name, callback, context ) {
                var me = this;
    
                if ( !callback ) {
                    return me;
                }
    
                eachEvent( name, callback, function( name, callback ) {
                    var once = function() {
                            me.off( name, once );
                            return callback.apply( context || me, arguments );
                        };
    
                    once._cb = callback;
                    me.on( name, once, context );
                });
    
                return me;
            },
    
            /**
             * 解除事件绑定
             * @method off
             * @grammar off( [name[, callback[, context] ] ] ) => self
             * @param  {String}   [name]     事件名
             * @param  {Function} [callback] 事件处理器
             * @param  {Object}   [context]  事件处理器的上下文。
             * @return {self} 返回自身，方便链式
             * @chainable
             */
            off: function( name, cb, ctx ) {
                var events = this._events;
    
                if ( !events ) {
                    return this;
                }
    
                if ( !name && !cb && !ctx ) {
                    this._events = [];
                    return this;
                }
    
                eachEvent( name, cb, function( name, cb ) {
                    $.each( findHandlers( events, name, cb, ctx ), function() {
                        delete events[ this.id ];
                    });
                });
    
                return this;
            },
    
            /**
             * 触发事件
             * @method trigger
             * @grammar trigger( name[, args...] ) => self
             * @param  {String}   type     事件名
             * @param  {*} [...] 任意参数
             * @return {Boolean} 如果handler中return false了，则返回false, 否则返回true
             */
            trigger: function( type ) {
                var args, events, allEvents;
    
                if ( !this._events || !type ) {
                    return this;
                }
    
                args = slice.call( arguments, 1 );
                events = findHandlers( this._events, type );
                allEvents = findHandlers( this._events, 'all' );
    
                return triggerHanders( events, args ) &&
                        triggerHanders( allEvents, arguments );
            }
        };
    
        /**
         * 中介者，它本身是个单例，但可以通过[installTo](#WebUploader:Mediator:installTo)方法，使任何对象具备事件行为。
         * 主要目的是负责模块与模块之间的合作，降低耦合度。
         *
         * @class Mediator
         */
        return $.extend({
    
            /**
             * 可以通过这个接口，使任何对象具备事件功能。
             * @method installTo
             * @param  {Object} obj 需要具备事件行为的对象。
             * @return {Object} 返回obj.
             */
            installTo: function( obj ) {
                return $.extend( obj, protos );
            }
    
        }, protos );
    });
    /**
     * @fileOverview Uploader上传类
     */
    define('uploader',[
        'base',
        'mediator'
    ], function( Base, Mediator ) {
    
        var $ = Base.$;
    
        /**
         * 上传入口类。
         * @class Uploader
         * @constructor
         * @grammar new Uploader( opts ) => Uploader
         * @example
         * var uploader = WebUploader.Uploader({
         *     swf: 'path_of_swf/Uploader.swf',
         *
         *     // 开起分片上传。
         *     chunked: true
         * });
         */
        function Uploader( opts ) {
            this.options = $.extend( true, {}, Uploader.options, opts );
            this._init( this.options );
        }
    
        // default Options
        // widgets中有相应扩展
        Uploader.options = {
            // 是否开启调试模式
            debug: false,
        };
        Mediator.installTo( Uploader.prototype );
    
        // 批量添加纯命令式方法。
        $.each({
            upload: 'start-upload',
            stop: 'stop-upload',
            getFile: 'get-file',
            getFiles: 'get-files',
            addFile: 'add-file',
            addFiles: 'add-file',
            sort: 'sort-files',
            removeFile: 'remove-file',
            cancelFile: 'cancel-file',
            skipFile: 'skip-file',
            retry: 'retry',
            isInProgress: 'is-in-progress',
            makeThumb: 'make-thumb',
            md5File: 'md5-file',
            getDimension: 'get-dimension',
            addButton: 'add-btn',
            predictRuntimeType: 'predict-runtime-type',
            refresh: 'refresh',
            disable: 'disable',
            enable: 'enable',
            reset: 'reset'
        }, function( fn, command ) {
            Uploader.prototype[ fn ] = function() {
                return this.request( command, arguments );
            };
        });
    
        $.extend( Uploader.prototype, {
            state: 'pending',
    
            _init: function( opts ) {
                var me = this;
    
                me.request( 'init', opts, function() {
                    me.state = 'ready';
                    me.trigger('ready');
                });
            },
    
            /**
             * 获取或者设置Uploader配置项。
             * @method option
             * @grammar option( key ) => *
             * @grammar option( key, val ) => self
             * @example
             *
             * // 初始状态图片上传前不会压缩
             * var uploader = new WebUploader.Uploader({
             *     compress: null;
             * });
             *
             * // 修改后图片上传前，尝试将图片压缩到1600 * 1600
             * uploader.option( 'compress', {
             *     width: 1600,
             *     height: 1600
             * });
             */
            option: function( key, val ) {
                var opts = this.options;
    
                // setter
                if ( arguments.length > 1 ) {
    
                    if ( $.isPlainObject( val ) &&
                            $.isPlainObject( opts[ key ] ) ) {
                        $.extend( opts[ key ], val );
                    } else {
                        opts[ key ] = val;
                    }
    
                } else {    // getter
                    return key ? opts[ key ] : opts;
                }
            },
    
            /**
             * 获取文件统计信息。返回一个包含一下信息的对象。
             * * `successNum` 上传成功的文件数
             * * `progressNum` 上传中的文件数
             * * `cancelNum` 被删除的文件数
             * * `invalidNum` 无效的文件数
             * * `uploadFailNum` 上传失败的文件数
             * * `queueNum` 还在队列中的文件数
             * * `interruptNum` 被暂停的文件数
             * @method getStats
             * @grammar getStats() => Object
             */
            getStats: function() {
                // return this._mgr.getStats.apply( this._mgr, arguments );
                var stats = this.request('get-stats');
    
                return stats ? {
                    successNum: stats.numOfSuccess,
                    progressNum: stats.numOfProgress,
    
                    // who care?
                    // queueFailNum: 0,
                    cancelNum: stats.numOfCancel,
                    invalidNum: stats.numOfInvalid,
                    uploadFailNum: stats.numOfUploadFailed,
                    queueNum: stats.numOfQueue,
                    interruptNum: stats.numOfInterrupt
                } : {};
            },
    
            // 需要重写此方法来来支持opts.onEvent和instance.onEvent的处理器
            trigger: function( type/*, args...*/ ) {
                var args = [].slice.call( arguments, 1 ),
                    opts = this.options,
                    name = 'on' + type.substring( 0, 1 ).toUpperCase() +
                        type.substring( 1 );
    
                if (
                        // 调用通过on方法注册的handler.
                        Mediator.trigger.apply( this, arguments ) === false ||
    
                        // 调用opts.onEvent
                        $.isFunction( opts[ name ] ) &&
                        opts[ name ].apply( this, args ) === false ||
    
                        // 调用this.onEvent
                        $.isFunction( this[ name ] ) &&
                        this[ name ].apply( this, args ) === false ||
    
                        // 广播所有uploader的事件。
                        Mediator.trigger.apply( Mediator,
                        [ this, type ].concat( args ) ) === false ) {
    
                    return false;
                }
    
                return true;
            },
    
            /**
             * 销毁 webuploader 实例
             * @method destroy
             * @grammar destroy() => undefined
             */
            destroy: function() {
                this.request( 'destroy', arguments );
                this.off();
            },
    
            // widgets/widget.js将补充此方法的详细文档。
            request: Base.noop
        });
    
        /**
         * 创建Uploader实例，等同于new Uploader( opts );
         * @method create
         * @class Base
         * @static
         * @grammar Base.create( opts ) => Uploader
         */
        Base.create = Uploader.create = function( opts ) {
            return new Uploader( opts );
        };
    
        // 暴露Uploader，可以通过它来扩展业务逻辑。
        Base.Uploader = Uploader;
    
        return Uploader;
    });
    
    /**
     * @fileOverview Runtime管理器，负责Runtime的选择, 连接
     */
    define('runtime/runtime',[
        'base',
        'mediator'
    ], function( Base, Mediator ) {
    
        var $ = Base.$,
            factories = {},
    
            // 获取对象的第一个key
            getFirstKey = function( obj ) {
                for ( var key in obj ) {
                    if ( obj.hasOwnProperty( key ) ) {
                        return key;
                    }
                }
                return null;
            };
    
        // 接口类。
        function Runtime( options ) {
            this.options = $.extend({
                container: document.body
            }, options );
            this.uid = Base.guid('rt_');
        }
    
        $.extend( Runtime.prototype, {
    
            getContainer: function() {
                var opts = this.options,
                    parent, container;
    
                if ( this._container ) {
                    return this._container;
                }
    
                parent = $( opts.container || document.body );
                container = $( document.createElement('div') );
    
                container.attr( 'id', 'rt_' + this.uid );
                container.css({
                    position: 'absolute',
                    top: '0px',
                    left: '0px',
                    width: '1px',
                    height: '1px',
                    overflow: 'hidden'
                });
    
                parent.append( container );
                parent.addClass('webuploader-container');
                this._container = container;
                this._parent = parent;
                return container;
            },
    
            init: Base.noop,
            exec: Base.noop,
    
            destroy: function() {
                this._container && this._container.remove();
                this._parent && this._parent.removeClass('webuploader-container');
                this.off();
            }
        });
    
        Runtime.orders = 'html5,flash';
    
    
        /**
         * 添加Runtime实现。
         * @param {String} type    类型
         * @param {Runtime} factory 具体Runtime实现。
         */
        Runtime.addRuntime = function( type, factory ) {
            factories[ type ] = factory;
        };
    
        Runtime.hasRuntime = function( type ) {
            return !!(type ? factories[ type ] : getFirstKey( factories ));
        };
    
        Runtime.create = function( opts, orders ) {
            var type, runtime;
    
            orders = orders || Runtime.orders;
            $.each( orders.split( /\s*,\s*/g ), function() {
                if ( factories[ this ] ) {
                    type = this;
                    return false;
                }
            });
    
            type = type || getFirstKey( factories );
    
            if ( !type ) {
                throw new Error('Runtime Error');
            }
    
            runtime = new factories[ type ]( opts );
            return runtime;
        };
    
        Mediator.installTo( Runtime.prototype );
        return Runtime;
    });
    
    /**
     * @fileOverview Runtime管理器，负责Runtime的选择, 连接
     */
    define('runtime/client',[
        'base',
        'mediator',
        'runtime/runtime'
    ], function( Base, Mediator, Runtime ) {
    
        var cache;
    
        cache = (function() {
            var obj = {};
    
            return {
                add: function( runtime ) {
                    obj[ runtime.uid ] = runtime;
                },
    
                get: function( ruid, standalone ) {
                    var i;
    
                    if ( ruid ) {
                        return obj[ ruid ];
                    }
    
                    for ( i in obj ) {
                        // 有些类型不能重用，比如filepicker.
                        if ( standalone && obj[ i ].__standalone ) {
                            continue;
                        }
    
                        return obj[ i ];
                    }
    
                    return null;
                },
    
                remove: function( runtime ) {
                    delete obj[ runtime.uid ];
                }
            };
        })();
    
        function RuntimeClient( component, standalone ) {
            var deferred = Base.Deferred(),
                runtime;
    
            this.uid = Base.guid('client_');
    
            // 允许runtime没有初始化之前，注册一些方法在初始化后执行。
            this.runtimeReady = function( cb ) {
                return deferred.done( cb );
            };
    
            this.connectRuntime = function( opts, cb ) {
    
                // already connected.
                if ( runtime ) {
                    throw new Error('already connected!');
                }
    
                deferred.done( cb );
    
                if ( typeof opts === 'string' && cache.get( opts ) ) {
                    runtime = cache.get( opts );
                }
    
                // 像filePicker只能独立存在，不能公用。
                runtime = runtime || cache.get( null, standalone );
    
                // 需要创建
                if ( !runtime ) {
                    runtime = Runtime.create( opts, opts.runtimeOrder );
                    runtime.__promise = deferred.promise();
                    runtime.once( 'ready', deferred.resolve );
                    runtime.init();
                    cache.add( runtime );
                    runtime.__client = 1;
                } else {
                    // 来自cache
                    Base.$.extend( runtime.options, opts );
                    runtime.__promise.then( deferred.resolve );
                    runtime.__client++;
                }
    
                standalone && (runtime.__standalone = standalone);
                return runtime;
            };
    
            this.getRuntime = function() {
                return runtime;
            };
    
            this.disconnectRuntime = function() {
                if ( !runtime ) {
                    return;
                }
    
                runtime.__client--;
    
                if ( runtime.__client <= 0 ) {
                    cache.remove( runtime );
                    delete runtime.__promise;
                    runtime.destroy();
                }
    
                runtime = null;
            };
    
            this.exec = function() {
                if ( !runtime ) {
                    return;
                }
    
                var args = Base.slice( arguments );
                component && args.unshift( component );
    
                return runtime.exec.apply( this, args );
            };
    
            this.getRuid = function() {
                return runtime && runtime.uid;
            };
    
            this.destroy = (function( destroy ) {
                return function() {
                    destroy && destroy.apply( this, arguments );
                    this.trigger('destroy');
                    this.off();
                    this.exec('destroy');
                    this.disconnectRuntime();
                };
            })( this.destroy );
        }
    
        Mediator.installTo( RuntimeClient.prototype );
        return RuntimeClient;
    });
    /**
     * @fileOverview 错误信息
     */
    define('lib/dnd',[
        'base',
        'mediator',
        'runtime/client'
    ], function( Base, Mediator, RuntimeClent ) {
    
        var $ = Base.$;
    
        function DragAndDrop( opts ) {
            opts = this.options = $.extend({}, DragAndDrop.options, opts );
    
            opts.container = $( opts.container );
    
            if ( !opts.container.length ) {
                return;
            }
    
            RuntimeClent.call( this, 'DragAndDrop' );
        }
    
        DragAndDrop.options = {
            accept: null,
            disableGlobalDnd: false
        };
    
        Base.inherits( RuntimeClent, {
            constructor: DragAndDrop,
    
            init: function() {
                var me = this;
    
                me.connectRuntime( me.options, function() {
                    me.exec('init');
                    me.trigger('ready');
                });
            }
        });
    
        Mediator.installTo( DragAndDrop.prototype );
    
        return DragAndDrop;
    });
    /**
     * @fileOverview 组件基类。
     */
    define('widgets/widget',[
        'base',
        'uploader'
    ], function( Base, Uploader ) {
    
        var $ = Base.$,
            _init = Uploader.prototype._init,
            _destroy = Uploader.prototype.destroy,
            IGNORE = {},
            widgetClass = [];
    
        function isArrayLike( obj ) {
            if ( !obj ) {
                return false;
            }
    
            var length = obj.length,
                type = $.type( obj );
    
            if ( obj.nodeType === 1 && length ) {
                return true;
            }
    
            return type === 'array' || type !== 'function' && type !== 'string' &&
                    (length === 0 || typeof length === 'number' && length > 0 &&
                    (length - 1) in obj);
        }
    
        function Widget( uploader ) {
            this.owner = uploader;
            this.options = uploader.options;
        }
    
        $.extend( Widget.prototype, {
    
            init: Base.noop,
    
            // 类Backbone的事件监听声明，监听uploader实例上的事件
            // widget直接无法监听事件，事件只能通过uploader来传递
            invoke: function( apiName, args ) {
    
                /*
                    {
                        'make-thumb': 'makeThumb'
                    }
                 */
                var map = this.responseMap;
    
                // 如果无API响应声明则忽略
                if ( !map || !(apiName in map) || !(map[ apiName ] in this) ||
                        !$.isFunction( this[ map[ apiName ] ] ) ) {
    
                    return IGNORE;
                }
    
                return this[ map[ apiName ] ].apply( this, args );
    
            },
    
            /**
             * 发送命令。当传入`callback`或者`handler`中返回`promise`时。返回一个当所有`handler`中的promise都完成后完成的新`promise`。
             * @method request
             * @grammar request( command, args ) => * | Promise
             * @grammar request( command, args, callback ) => Promise
             * @for  Uploader
             */
            request: function() {
                return this.owner.request.apply( this.owner, arguments );
            }
        });
    
        // 扩展Uploader.
        $.extend( Uploader.prototype, {
    
            /**
             * @property {String | Array} [disableWidgets=undefined]
             * @namespace options
             * @for Uploader
             * @description 默认所有 Uploader.register 了的 widget 都会被加载，如果禁用某一部分，请通过此 option 指定黑名单。
             */
    
            // 覆写_init用来初始化widgets
            _init: function() {
                var me = this,
                    widgets = me._widgets = [],
                    deactives = me.options.disableWidgets || '';
    
                $.each( widgetClass, function( _, klass ) {
                    (!deactives || !~deactives.indexOf( klass._name )) &&
                        widgets.push( new klass( me ) );
                });
    
                return _init.apply( me, arguments );
            },
    
            request: function( apiName, args, callback ) {
                var i = 0,
                    widgets = this._widgets,
                    len = widgets && widgets.length,
                    rlts = [],
                    dfds = [],
                    widget, rlt, promise, key;
    
                args = isArrayLike( args ) ? args : [ args ];
    
                for ( ; i < len; i++ ) {
                    widget = widgets[ i ];
                    rlt = widget.invoke( apiName, args );
    
                    if ( rlt !== IGNORE ) {
    
                        // Deferred对象
                        if ( Base.isPromise( rlt ) ) {
                            dfds.push( rlt );
                        } else {
                            rlts.push( rlt );
                        }
                    }
                }
    
                // 如果有callback，则用异步方式。
                if ( callback || dfds.length ) {
                    promise = Base.when.apply( Base, dfds );
                    key = promise.pipe ? 'pipe' : 'then';
    
                    // 很重要不能删除。删除了会死循环。
                    // 保证执行顺序。让callback总是在下一个 tick 中执行。
                    return promise[ key ](function() {
                                var deferred = Base.Deferred(),
                                    args = arguments;
    
                                if ( args.length === 1 ) {
                                    args = args[ 0 ];
                                }
    
                                setTimeout(function() {
                                    deferred.resolve( args );
                                }, 1 );
    
                                return deferred.promise();
                            })[ callback ? key : 'done' ]( callback || Base.noop );
                } else {
                    return rlts[ 0 ];
                }
            },
    
            destroy: function() {
                _destroy.apply( this, arguments );
                this._widgets = null;
            }
        });
    
        /**
         * 添加组件
         * @grammar Uploader.register(proto);
         * @grammar Uploader.register(map, proto);
         * @param  {object} responseMap API 名称与函数实现的映射
         * @param  {object} proto 组件原型，构造函数通过 constructor 属性定义
         * @method Uploader.register
         * @for Uploader
         * @example
         * Uploader.register({
         *     'make-thumb': 'makeThumb'
         * }, {
         *     init: function( options ) {},
         *     makeThumb: function() {}
         * });
         *
         * Uploader.register({
         *     'make-thumb': function() {
         *         
         *     }
         * });
         */
        Uploader.register = Widget.register = function( responseMap, widgetProto ) {
            var map = { init: 'init', destroy: 'destroy', name: 'anonymous' },
                klass;
    
            if ( arguments.length === 1 ) {
                widgetProto = responseMap;
    
                // 自动生成 map 表。
                $.each(widgetProto, function(key) {
                    if ( key[0] === '_' || key === 'name' ) {
                        key === 'name' && (map.name = widgetProto.name);
                        return;
                    }
    
                    map[key.replace(/[A-Z]/g, '-$&').toLowerCase()] = key;
                });
    
            } else {
                map = $.extend( map, responseMap );
            }
    
            widgetProto.responseMap = map;
            klass = Base.inherits( Widget, widgetProto );
            klass._name = map.name;
            widgetClass.push( klass );
    
            return klass;
        };
    
        /**
         * 删除插件，只有在注册时指定了名字的才能被删除。
         * @grammar Uploader.unRegister(name);
         * @param  {string} name 组件名字
         * @method Uploader.unRegister
         * @for Uploader
         * @example
         *
         * Uploader.register({
         *     name: 'custom',
         *     
         *     'make-thumb': function() {
         *         
         *     }
         * });
         *
         * Uploader.unRegister('custom');
         */
        Uploader.unRegister = Widget.unRegister = function( name ) {
            if ( !name || name === 'anonymous' ) {
                return;
            }
            
            // 删除指定的插件。
            for ( var i = widgetClass.length; i--; ) {
                if ( widgetClass[i]._name === name ) {
                    widgetClass.splice(i, 1)
                }
            }
        };
    
        return Widget;
    });
    /**
     * @fileOverview DragAndDrop Widget。
     */
    define('widgets/filednd',[
        'base',
        'uploader',
        'lib/dnd',
        'widgets/widget'
    ], function( Base, Uploader, Dnd ) {
        var $ = Base.$;
    
        Uploader.options.dnd = '';
    
        /**
         * @property {Selector} [dnd=undefined]  指定Drag And Drop拖拽的容器，如果不指定，则不启动。
         * @namespace options
         * @for Uploader
         */
        
        /**
         * @property {Selector} [disableGlobalDnd=false]  是否禁掉整个页面的拖拽功能，如果不禁用，图片拖进来的时候会默认被浏览器打开。
         * @namespace options
         * @for Uploader
         */
    
        /**
         * @event dndAccept
         * @param {DataTransferItemList} items DataTransferItem
         * @description 阻止此事件可以拒绝某些类型的文件拖入进来。目前只有 chrome 提供这样的 API，且只能通过 mime-type 验证。
         * @for  Uploader
         */
        return Uploader.register({
            name: 'dnd',
            
            init: function( opts ) {
    
                if ( !opts.dnd ||
                        this.request('predict-runtime-type') !== 'html5' ) {
                    return;
                }
    
                var me = this,
                    deferred = Base.Deferred(),
                    options = $.extend({}, {
                        disableGlobalDnd: opts.disableGlobalDnd,
                        container: opts.dnd,
                        accept: opts.accept
                    }),
                    dnd;
    
                this.dnd = dnd = new Dnd( options );
    
                dnd.once( 'ready', deferred.resolve );
                dnd.on( 'drop', function( files ) {
                    me.request( 'add-file', [ files ]);
                });
    
                // 检测文件是否全部允许添加。
                dnd.on( 'accept', function( items ) {
                    return me.owner.trigger( 'dndAccept', items );
                });
    
                dnd.init();
    
                return deferred.promise();
            },
    
            destroy: function() {
                this.dnd && this.dnd.destroy();
            }
        });
    });
    
    /**
     * @fileOverview 错误信息
     */
    define('lib/filepaste',[
        'base',
        'mediator',
        'runtime/client'
    ], function( Base, Mediator, RuntimeClent ) {
    
        var $ = Base.$;
    
        function FilePaste( opts ) {
            opts = this.options = $.extend({}, opts );
            opts.container = $( opts.container || document.body );
            RuntimeClent.call( this, 'FilePaste' );
        }
    
        Base.inherits( RuntimeClent, {
            constructor: FilePaste,
    
            init: function() {
                var me = this;
    
                me.connectRuntime( me.options, function() {
                    me.exec('init');
                    me.trigger('ready');
                });
            }
        });
    
        Mediator.installTo( FilePaste.prototype );
    
        return FilePaste;
    });
    /**
     * @fileOverview 组件基类。
     */
    define('widgets/filepaste',[
        'base',
        'uploader',
        'lib/filepaste',
        'widgets/widget'
    ], function( Base, Uploader, FilePaste ) {
        var $ = Base.$;
    
        /**
         * @property {Selector} [paste=undefined]  指定监听paste事件的容器，如果不指定，不启用此功能。此功能为通过粘贴来添加截屏的图片。建议设置为`document.body`.
         * @namespace options
         * @for Uploader
         */
        return Uploader.register({
            name: 'paste',
            
            init: function( opts ) {
    
                if ( !opts.paste ||
                        this.request('predict-runtime-type') !== 'html5' ) {
                    return;
                }
    
                var me = this,
                    deferred = Base.Deferred(),
                    options = $.extend({}, {
                        container: opts.paste,
                        accept: opts.accept
                    }),
                    paste;
    
                this.paste = paste = new FilePaste( options );
    
                paste.once( 'ready', deferred.resolve );
                paste.on( 'paste', function( files ) {
                    me.owner.request( 'add-file', [ files ]);
                });
                paste.init();
    
                return deferred.promise();
            },
    
            destroy: function() {
                this.paste && this.paste.destroy();
            }
        });
    });
    /**
     * @fileOverview Blob
     */
    define('lib/blob',[
        'base',
        'runtime/client'
    ], function( Base, RuntimeClient ) {
    
        function Blob( ruid, source ) {
            var me = this;
    
            me.source = source;
            me.ruid = ruid;
            this.size = source.size || 0;
    
            // 如果没有指定 mimetype, 但是知道文件后缀。
            if ( !source.type && this.ext &&
                    ~'jpg,jpeg,png,gif,bmp'.indexOf( this.ext ) ) {
                this.type = 'image/' + (this.ext === 'jpg' ? 'jpeg' : this.ext);
            } else {
                this.type = source.type || 'application/octet-stream';
            }
    
            RuntimeClient.call( me, 'Blob' );
            this.uid = source.uid || this.uid;
    
            if ( ruid ) {
                me.connectRuntime( ruid );
            }
        }
    
        Base.inherits( RuntimeClient, {
            constructor: Blob,
    
            slice: function( start, end ) {
                return this.exec( 'slice', start, end );
            },
    
            getSource: function() {
                return this.source;
            }
        });
    
        return Blob;
    });
    /**
     * 为了统一化Flash的File和HTML5的File而存在。
     * 以至于要调用Flash里面的File，也可以像调用HTML5版本的File一下。
     * @fileOverview File
     */
    define('lib/file',[
        'base',
        'lib/blob'
    ], function( Base, Blob ) {
    
        var uid = 1,
            rExt = /\.([^.]+)$/;
    
        function File( ruid, file ) {
            var ext;
    
            this.name = file.name || ('untitled' + uid++);
            ext = rExt.exec( file.name ) ? RegExp.$1.toLowerCase() : '';
    
            // todo 支持其他类型文件的转换。
            // 如果有 mimetype, 但是文件名里面没有找出后缀规律
            if ( !ext && file.type ) {
                ext = /\/(jpg|jpeg|png|gif|bmp)$/i.exec( file.type ) ?
                        RegExp.$1.toLowerCase() : '';
                this.name += '.' + ext;
            }
    
            this.ext = ext;
            this.lastModifiedDate = file.lastModifiedDate || 
                    file.lastModified && new Date(file.lastModified).toLocaleString() ||
                    (new Date()).toLocaleString();
    
            Blob.apply( this, arguments );
        }
    
        return Base.inherits( Blob, File );
    });
    
    /**
     * @fileOverview 错误信息
     */
    define('lib/filepicker',[
        'base',
        'runtime/client',
        'lib/file'
    ], function( Base, RuntimeClient, File ) {
    
        var $ = Base.$;
    
        function FilePicker( opts ) {
            opts = this.options = $.extend({}, FilePicker.options, opts );
    
            opts.container = $( opts.id );
    
            if ( !opts.container.length ) {
                throw new Error('按钮指定错误');
            }
    
            opts.innerHTML = opts.innerHTML || opts.label ||
                    opts.container.html() || '';
    
            opts.button = $( opts.button || document.createElement('div') );
            opts.button.html( opts.innerHTML );
            opts.container.html( opts.button );
    
            RuntimeClient.call( this, 'FilePicker', true );
        }
    
        FilePicker.options = {
            button: null,
            container: null,
            label: null,
            innerHTML: null,
            multiple: true,
            accept: null,
            name: 'file',
            style: 'webuploader-pick'   //pick element class attribute, default is "webuploader-pick"
        };
    
        Base.inherits( RuntimeClient, {
            constructor: FilePicker,
    
            init: function() {
                var me = this,
                    opts = me.options,
                    button = opts.button,
                    style = opts.style;
    
                if (style)
                    button.addClass('webuploader-pick');
    
                me.on( 'all', function( type ) {
                    var files;
    
                    switch ( type ) {
                        case 'mouseenter':
                            if (style)
                                button.addClass('webuploader-pick-hover');
                            break;
    
                        case 'mouseleave':
                            if (style)
                                button.removeClass('webuploader-pick-hover');
                            break;
    
                        case 'change':
                            files = me.exec('getFiles');
                            me.trigger( 'select', $.map( files, function( file ) {
                                file = new File( me.getRuid(), file );
    
                                // 记录来源。
                                file._refer = opts.container;
                                return file;
                            }), opts.container );
                            break;
                    }
                });
    
                me.connectRuntime( opts, function() {
                    me.refresh();
                    me.exec( 'init', opts );
                    me.trigger('ready');
                });
    
                this._resizeHandler = Base.bindFn( this.refresh, this );
                $( window ).on( 'resize', this._resizeHandler );
            },
    
            refresh: function() {
                var shimContainer = this.getRuntime().getContainer(),
                    button = this.options.button,
                    /*
                    width = button.outerWidth ?
                            button.outerWidth() : button.width(),
    
                    height = button.outerHeight ?
                            button.outerHeight() : button.height(),
                    */
                    width = button[0] && button[0].offsetWidth || button.outerWidth() || button.width(),
                    height = button[0] && button[0].offsetHeight || button.outerHeight() || button.height(),
                    pos = button.offset();
    
                width && height && shimContainer.css({
                    bottom: 'auto',
                    right: 'auto',
                    width: width + 'px',
                    height: height + 'px'
                }).offset( pos );
            },
    
            enable: function() {
                var btn = this.options.button;
    
                btn.removeClass('webuploader-pick-disable');
                this.refresh();
            },
    
            disable: function() {
                var btn = this.options.button;
    
                this.getRuntime().getContainer().css({
                    top: '-99999px'
                });
    
                btn.addClass('webuploader-pick-disable');
            },
    
            destroy: function() {
                var btn = this.options.button;
                $( window ).off( 'resize', this._resizeHandler );
                btn.removeClass('webuploader-pick-disable webuploader-pick-hover ' +
                    'webuploader-pick');
            }
        });
    
        return FilePicker;
    });
    
    /**
     * @fileOverview 文件选择相关
     */
    define('widgets/filepicker',[
        'base',
        'uploader',
        'lib/filepicker',
        'widgets/widget'
    ], function( Base, Uploader, FilePicker ) {
        var $ = Base.$;
    
        $.extend( Uploader.options, {
    
            /**
             * @property {Selector | Object} [pick=undefined]
             * @namespace options
             * @for Uploader
             * @description 指定选择文件的按钮容器，不指定则不创建按钮。
             *
             * * `id` {Seletor|dom} 指定选择文件的按钮容器，不指定则不创建按钮。**注意** 这里虽然写的是 id, 但是不是只支持 id, 还支持 class, 或者 dom 节点。
             * * `label` {String} 请采用 `innerHTML` 代替
             * * `innerHTML` {String} 指定按钮文字。不指定时优先从指定的容器中看是否自带文字。
             * * `multiple` {Boolean} 是否开起同时选择多个文件能力。
             */
            pick: null,
    
            /**
             * @property {Array} [accept=null]
             * @namespace options
             * @for Uploader
             * @description 指定接受哪些类型的文件。 由于目前还有ext转mimeType表，所以这里需要分开指定。
             *
             * * `title` {String} 文字描述
             * * `extensions` {String} 允许的文件后缀，不带点，多个用逗号分割。
             * * `mimeTypes` {String} 多个用逗号分割。
             *
             * 如：
             *
             * ```
             * {
             *     title: 'Images',
             *     extensions: 'gif,jpg,jpeg,bmp,png',
             *     mimeTypes: 'image/*'
             * }
             * ```
             */
            accept: null/*{
                title: 'Images',
                extensions: 'gif,jpg,jpeg,bmp,png',
                mimeTypes: 'image/*'
            }*/
        });
    
        return Uploader.register({
            name: 'picker',
    
            init: function( opts ) {
                this.pickers = [];
                return opts.pick && this.addBtn( opts.pick );
            },
    
            refresh: function() {
                $.each( this.pickers, function() {
                    this.refresh();
                });
            },
    
            /**
             * @method addButton
             * @for Uploader
             * @grammar addButton( pick ) => Promise
             * @description
             * 添加文件选择按钮，如果一个按钮不够，需要调用此方法来添加。参数跟[options.pick](#WebUploader:Uploader:options)一致。
             * @example
             * uploader.addButton({
             *     id: '#btnContainer',
             *     innerHTML: '选择文件'
             * });
             */
            addBtn: function( pick ) {
                var me = this,
                    opts = me.options,
                    accept = opts.accept,
                    promises = [];
    
                if ( !pick ) {
                    return;
                }
    
                $.isPlainObject( pick ) || (pick = {
                    id: pick
                });
    
                $( pick.id ).each(function() {
                    var options, picker, deferred;
    
                    deferred = Base.Deferred();
    
                    options = $.extend({}, pick, {
                        accept: $.isPlainObject( accept ) ? [ accept ] : accept,
                        swf: opts.swf,
                        runtimeOrder: opts.runtimeOrder,
                        id: this
                    });
    
                    picker = new FilePicker( options );
    
                    picker.once( 'ready', deferred.resolve );
                    picker.on( 'select', function( files ) {
                        me.owner.request( 'add-file', [ files ]);
                    });
                    picker.on('dialogopen', function() {
                        me.owner.trigger('dialogOpen', picker.button);
                    });
                    picker.init();
    
                    me.pickers.push( picker );
    
                    promises.push( deferred.promise() );
                });
    
                return Base.when.apply( Base, promises );
            },
    
            disable: function() {
                $.each( this.pickers, function() {
                    this.disable();
                });
            },
    
            enable: function() {
                $.each( this.pickers, function() {
                    this.enable();
                });
            },
    
            destroy: function() {
                $.each( this.pickers, function() {
                    this.destroy();
                });
                this.pickers = null;
            }
        });
    });
    /**
     * @fileOverview Image
     */
    define('lib/image',[
        'base',
        'runtime/client',
        'lib/blob'
    ], function( Base, RuntimeClient, Blob ) {
        var $ = Base.$;
    
        // 构造器。
        function Image( opts ) {
            this.options = $.extend({}, Image.options, opts );
            RuntimeClient.call( this, 'Image' );
    
            this.on( 'load', function() {
                this._info = this.exec('info');
                this._meta = this.exec('meta');
            });
        }
    
        // 默认选项。
        Image.options = {
    
            // 默认的图片处理质量
            quality: 90,
    
            // 是否裁剪
            crop: false,
    
            // 是否保留头部信息
            preserveHeaders: false,
    
            // 是否允许放大。
            allowMagnify: false
        };
    
        // 继承RuntimeClient.
        Base.inherits( RuntimeClient, {
            constructor: Image,
    
            info: function( val ) {
    
                // setter
                if ( val ) {
                    this._info = val;
                    return this;
                }
    
                // getter
                return this._info;
            },
    
            meta: function( val ) {
    
                // setter
                if ( val ) {
                    this._meta = val;
                    return this;
                }
    
                // getter
                return this._meta;
            },
    
            loadFromBlob: function( blob ) {
                var me = this,
                    ruid = blob.getRuid();
    
                this.connectRuntime( ruid, function() {
                    me.exec( 'init', me.options );
                    me.exec( 'loadFromBlob', blob );
                });
            },
    
            resize: function() {
                var args = Base.slice( arguments );
                return this.exec.apply( this, [ 'resize' ].concat( args ) );
            },
    
            crop: function() {
                var args = Base.slice( arguments );
                return this.exec.apply( this, [ 'crop' ].concat( args ) );
            },
    
            getAsDataUrl: function( type ) {
                return this.exec( 'getAsDataUrl', type );
            },
    
            getAsBlob: function( type ) {
                var blob = this.exec( 'getAsBlob', type );
    
                return new Blob( this.getRuid(), blob );
            }
        });
    
        return Image;
    });
    /**
     * @fileOverview 图片操作, 负责预览图片和上传前压缩图片
     */
    define('widgets/image',[
        'base',
        'uploader',
        'lib/image',
        'widgets/widget'
    ], function( Base, Uploader, Image ) {
    
        // import image compress
        var imageCompression = null;
        (function(){
            var e,t;function _typeof(r){return(_typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(r){return typeof r}:function(r){return r&&"function"==typeof Symbol&&r.constructor===Symbol&&r!==Symbol.prototype?"symbol":typeof r})(r)}function ownKeys(r,n){var i=Object.keys(r);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(r);n&&(a=a.filter(function(n){return Object.getOwnPropertyDescriptor(r,n).enumerable})),i.push.apply(i,a)}return i}function _objectSpread(r){for(var n=1;n<arguments.length;n++){var i=null!=arguments[n]?arguments[n]:{};n%2?ownKeys(Object(i),!0).forEach(function(n){_defineProperty(r,n,i[n])}):Object.getOwnPropertyDescriptors?Object.defineProperties(r,Object.getOwnPropertyDescriptors(i)):ownKeys(Object(i)).forEach(function(n){Object.defineProperty(r,n,Object.getOwnPropertyDescriptor(i,n))})}return r}function _slicedToArray(r,n){return _arrayWithHoles(r)||_iterableToArrayLimit(r,n)||_unsupportedIterableToArray(r,n)||_nonIterableRest()}function _nonIterableRest(){throw TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}function _unsupportedIterableToArray(r,n){if(r){if("string"==typeof r)return _arrayLikeToArray(r,n);var i=Object.prototype.toString.call(r).slice(8,-1);if("Object"===i&&r.constructor&&(i=r.constructor.name),"Map"===i||"Set"===i)return Array.from(r);if("Arguments"===i||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(i))return _arrayLikeToArray(r,n)}}function _arrayLikeToArray(r,n){(null==n||n>r.length)&&(n=r.length);for(var i=0,a=Array(n);i<n;i++)a[i]=r[i];return a}function _iterableToArrayLimit(r,n){var i=null==r?null:"undefined"!=typeof Symbol&&r[Symbol.iterator]||r["@@iterator"];if(null!=i){var a,o,f,_,$=[],u=!0,s=!1;try{if(f=(i=i.call(r)).next,0===n){if(Object(i)!==i)return;u=!1}else for(;!(u=(a=f.call(i)).done)&&($.push(a.value),$.length!==n);u=!0);}catch(l){s=!0,o=l}finally{try{if(!u&&null!=i.return&&(_=i.return(),Object(_)!==_))return}finally{if(s)throw o}}return $}}function _arrayWithHoles(r){if(Array.isArray(r))return r}function _defineProperty(r,n,i){return(n=_toPropertyKey(n))in r?Object.defineProperty(r,n,{value:i,enumerable:!0,configurable:!0,writable:!0}):r[n]=i,r}function _toPropertyKey(r){var n=_toPrimitive(r,"string");return"symbol"===_typeof(n)?n:String(n)}function _toPrimitive(r,n){if("object"!==_typeof(r)||null===r)return r;var i=r[Symbol.toPrimitive];if(void 0!==i){var a=i.call(r,n||"default");if("object"!==_typeof(a))return a;throw TypeError("@@toPrimitive must return a primitive value.")}return("string"===n?String:Number)(r)}imageCompression=(t=function(){function r(r,n){return new Promise(function(i,a){var o;return s(r).then(function(r){try{return o=r,i(new Blob([n.slice(0,2),o,n.slice(2)],{type:"image/jpeg"}))}catch(f){return a(f)}},a)})}var n,i,a,o,f,_,$,u,s=function r(n){return new Promise(function(r,i){var a=new FileReader;a.addEventListener("load",function(n){var a=n.target.result,o=new DataView(a),f=0;if(65496!==o.getUint16(f))return i("not a valid JPEG");for(f+=2;;){var _=o.getUint16(f);if(65498===_)break;var $=o.getUint16(f+2);if(65505===_&&1165519206===o.getUint32(f+4)){var u=f+10,s=void 0;switch(o.getUint16(u)){case 18761:s=!0;break;case 19789:s=!1;break;default:return i("TIFF header contains invalid endian")}if(42!==o.getUint16(u+2,s))return i("TIFF header contains invalid version");for(var l=o.getUint32(u+4,s),c=u+l+2+12*o.getUint16(u+l,s),h=u+l+2;h<c;h+=12)if(274==o.getUint16(h,s)){if(3!==o.getUint16(h+2,s))return i("Orientation data type is invalid");if(1!==o.getUint32(h+4,s))return i("Orientation data count is invalid");o.setUint16(h+8,1,s);break}return r(a.slice(f,f+2+$))}f+=2+$}return r(new Blob)}),a.readAsArrayBuffer(n)})},l={};a={get exports(){return l},set exports(t){l=t}},_={},a.exports=_,_.parse=function(r,n){for(var i=_.bin.readUshort,a=_.bin.readUint,o=0,f={},$=new Uint8Array(r),u=$.length-4;101010256!=a($,u);)u--;o=u,o+=4;var s=i($,o+=4);i($,o+=2);var l=a($,o+=2),c=a($,o+=4);o+=4,o=c;for(var h=0;h<s;h++){a($,o),o+=4,o+=4,o+=4,a($,o+=4),l=a($,o+=4);var d=a($,o+=4),v=i($,o+=4),A=i($,o+2),g=i($,o+4);o+=6;var p=a($,o+=8);o+=4,o+=v+A+g,_._readLocal($,p,f,l,d,n)}return f},_._readLocal=function(r,n,i,a,o,f){var $=_.bin.readUshort,u=_.bin.readUint;u(r,n),$(r,n+=4),$(r,n+=2);var s=$(r,n+=2);u(r,n+=2),u(r,n+=4),n+=4;var l=$(r,n+=8),c=$(r,n+=2);n+=2;var h=_.bin.readUTF8(r,n,l);if(n+=l,n+=c,f)i[h]={size:o,csize:a};else{var d=new Uint8Array(r.buffer,n);if(0==s)i[h]=new Uint8Array(d.buffer.slice(n,n+a));else{if(8!=s)throw"unknown compression method: "+s;var v=new Uint8Array(o);_.inflateRaw(d,v),i[h]=v}}},_.inflateRaw=function(r,n){return _.F.inflate(r,n)},_.inflate=function(r,n){return r[0],r[1],_.inflateRaw(new Uint8Array(r.buffer,r.byteOffset+2,r.length-6),n)},_.deflate=function(r,n){null==n&&(n={level:6});var i=0,a=new Uint8Array(50+Math.floor(1.1*r.length));a[i]=120,a[i+1]=156,i+=2,i=_.F.deflateRaw(r,a,i,n.level);var o=_.adler(r,0,r.length);return a[i+0]=o>>>24&255,a[i+1]=o>>>16&255,a[i+2]=o>>>8&255,a[i+3]=o>>>0&255,new Uint8Array(a.buffer,0,i+4)},_.deflateRaw=function(r,n){null==n&&(n={level:6});var i=new Uint8Array(50+Math.floor(1.1*r.length)),a=_.F.deflateRaw(r,i,a,n.level);return new Uint8Array(i.buffer,0,a)},_.encode=function(r,n){null==n&&(n=!1);var i=0,a=_.bin.writeUint,o=_.bin.writeUshort,f={};for(var $ in r){var u=!_._noNeed($)&&!n,s=r[$],l=_.crc.crc(s,0,s.length);f[$]={cpr:u,usize:s.length,crc:l,file:u?_.deflateRaw(s):s}}for(var $ in f)i+=f[$].file.length+30+46+2*_.bin.sizeUTF8($);i+=22;var c=new Uint8Array(i),h=0,d=[];for(var $ in f){var v=f[$];d.push(h),h=_._writeHeader(c,h,$,v,0)}var A=0,g=h;for(var $ in f)v=f[$],d.push(h),h=_._writeHeader(c,h,$,v,1,d[A++]);var p=h-g;return a(c,h,101010256),h+=4,o(c,h+=4,A),o(c,h+=2,A),a(c,h+=2,p),a(c,h+=4,g),h+=4,h+=2,c.buffer},_._noNeed=function(r){var n=r.split(".").pop().toLowerCase();return -1!="png,jpg,jpeg,zip".indexOf(n)},_._writeHeader=function(r,n,i,a,o,f){var $=_.bin.writeUint,u=_.bin.writeUshort,s=a.file;return $(r,n,0==o?67324752:33639248),n+=4,1==o&&(n+=2),u(r,n,20),u(r,n+=2,0),u(r,n+=2,a.cpr?8:0),$(r,n+=2,0),$(r,n+=4,a.crc),$(r,n+=4,s.length),$(r,n+=4,a.usize),u(r,n+=4,_.bin.sizeUTF8(i)),u(r,n+=2,0),n+=2,1==o&&(n+=2,n+=2,$(r,n+=6,f),n+=4),n+=_.bin.writeUTF8(r,n,i),0==o&&(r.set(s,n),n+=s.length),n},_.crc={table:function(){for(var r=new Uint32Array(256),n=0;n<256;n++){for(var i=n,a=0;a<8;a++)1&i?i=3988292384^i>>>1:i>>>=1;r[n]=i}return r}(),update:function r(n,i,a,o){for(var f=0;f<o;f++)n=_.crc.table[255&(n^i[a+f])]^n>>>8;return n},crc:function r(n,i,a){return 4294967295^_.crc.update(4294967295,n,i,a)}},_.adler=function(r,n,i){for(var a=1,o=0,f=n,_=n+i;f<_;){for(var $=Math.min(f+5552,_);f<$;)o+=a+=r[f++];a%=65521,o%=65521}return o<<16|a},_.bin={readUshort:function r(n,i){return n[i]|n[i+1]<<8},writeUshort:function r(n,i,a){n[i]=255&a,n[i+1]=a>>8&255},readUint:function r(n,i){return 16777216*n[i+3]+(n[i+2]<<16|n[i+1]<<8|n[i])},writeUint:function r(n,i,a){n[i]=255&a,n[i+1]=a>>8&255,n[i+2]=a>>16&255,n[i+3]=a>>24&255},readASCII:function r(n,i,a){for(var o="",f=0;f<a;f++)o+=String.fromCharCode(n[i+f]);return o},writeASCII:function r(n,i,a){for(var o=0;o<a.length;o++)n[i+o]=a.charCodeAt(o)},pad:function r(n){return n.length<2?"0"+n:n},readUTF8:function r(n,i,a){for(var o,f="",$=0;$<a;$++)f+="%"+_.bin.pad(n[i+$].toString(16));try{o=decodeURIComponent(f)}catch(u){return _.bin.readASCII(n,i,a)}return o},writeUTF8:function r(n,i,a){for(var o=a.length,f=0,_=0;_<o;_++){var $=a.charCodeAt(_);if(0==(4294967168&$))n[i+f]=$,f++;else if(0==(4294965248&$))n[i+f]=192|$>>6,n[i+f+1]=128|$>>0&63,f+=2;else if(0==(4294901760&$))n[i+f]=224|$>>12,n[i+f+1]=128|$>>6&63,n[i+f+2]=128|$>>0&63,f+=3;else{if(0!=(4292870144&$))throw"e";n[i+f]=240|$>>18,n[i+f+1]=128|$>>12&63,n[i+f+2]=128|$>>6&63,n[i+f+3]=128|$>>0&63,f+=4}}return f},sizeUTF8:function r(n){for(var i=n.length,a=0,o=0;o<i;o++){var f=n.charCodeAt(o);if(0==(4294967168&f))a++;else if(0==(4294965248&f))a+=2;else if(0==(4294901760&f))a+=3;else{if(0!=(4292870144&f))throw"e";a+=4}}return a}},_.F={},_.F.deflateRaw=function(r,n,i,a){var o=[[0,0,0,0,0],[4,4,8,4,0],[4,5,16,8,0],[4,6,16,16,0],[4,10,16,32,0],[8,16,32,32,0],[8,16,128,128,0],[8,32,128,256,0],[32,128,258,1024,1],[32,258,258,4096,1]][a],f=_.F.U,$=_.F._goodIndex;_.F._hash;var u=_.F._putsE,s=0,l=i<<3,c=0,h=r.length;if(0==a){for(;s<h;)u(n,l,s+(B=Math.min(65535,h-s))==h?1:0),l=_.F._copyExact(r,s,B,n,l+8),s+=B;return l>>>3}var d=f.lits,v=f.strt,A=f.prev,g=0,p=0,w=0,b=0,m=0,y=0;for(h>2&&(v[y=_.F._hash(r,0)]=0),s=0;s<h;s++){if(m=y,s+1<h-2){y=_.F._hash(r,s+1);var E=s+1&32767;A[E]=v[y],v[y]=E}if(c<=s){(g>14e3||p>26697)&&h-s>100&&(c<s&&(d[g]=s-c,g+=2,c=s),l=_.F._writeBlock(s==h-1||c==h?1:0,d,g,b,r,w,s-w,n,l),g=p=b=0,w=s);var F=0;s<h-2&&(F=_.F._bestMatch(r,s,A,m,Math.min(o[2],h-s),o[3]));var B=F>>>16,Q=65535&F;if(0!=F){Q=65535&F;var I=$(B=F>>>16,f.of0);f.lhst[257+I]++;var U=$(Q,f.df0);f.dhst[U]++,b+=f.exb[I]+f.dxb[U],d[g]=B<<23|s-c,d[g+1]=Q<<16|I<<8|U,g+=2,c=s+B}else f.lhst[r[s]]++;p++}}for(w==s&&0!=r.length||(c<s&&(d[g]=s-c,g+=2,c=s),l=_.F._writeBlock(1,d,g,b,r,w,s-w,n,l),g=0,p=0,g=p=b=0,w=s);0!=(7&l);)l++;return l>>>3},_.F._bestMatch=function(r,n,i,a,o,f){var $=32767&n,u=i[$],s=$-u+32768&32767;if(u==$||a!=_.F._hash(r,n-s))return 0;for(var l=0,c=0,h=Math.min(32767,n);s<=h&&0!=--f&&u!=$;){if(0==l||r[n+l]==r[n+l-s]){var d=_.F._howLong(r,n,s);if(d>l){if(c=s,(l=d)>=o)break;s+2<d&&(d=s+2);for(var v=0,A=0;A<d-2;A++){var g=n-s+A+32768&32767,p=g-i[g]+32768&32767;p>v&&(v=p,u=g)}}}s+=($=u)-(u=i[$])+32768&32767}return l<<16|c},_.F._howLong=function(r,n,i){if(r[n]!=r[n-i]||r[n+1]!=r[n+1-i]||r[n+2]!=r[n+2-i])return 0;var a=n,o=Math.min(r.length,n+258);for(n+=3;n<o&&r[n]==r[n-i];)n++;return n-a},_.F._hash=function(r,n){return(r[n]<<8|r[n+1])+(r[n+2]<<4)&65535},_.saved=0,_.F._writeBlock=function(r,n,i,a,o,f,$,u,s){var l,c,h,d,v,A,g,p,w,b,m,y=_.F.U,E=_.F._putsF,F=_.F._putsE;y.lhst[256]++,d=(h=_.F.getTrees())[0],v=h[1],A=h[2],g=h[3],p=h[4],w=h[5],b=h[6],m=h[7];var B=32+(0==(s+3&7)?0:8-(s+3&7))+($<<3),Q=a+_.F.contSize(y.fltree,y.lhst)+_.F.contSize(y.fdtree,y.dhst),I=a+_.F.contSize(y.ltree,y.lhst)+_.F.contSize(y.dtree,y.dhst);I+=14+3*w+_.F.contSize(y.itree,y.ihst)+(2*y.ihst[16]+3*y.ihst[17]+7*y.ihst[18]);for(var U=0;U<286;U++)y.lhst[U]=0;for(U=0;U<30;U++)y.dhst[U]=0;for(U=0;U<19;U++)y.ihst[U]=0;var C=B<Q&&B<I?0:Q<I?1:2;if(E(u,s,r),E(u,s+1,C),s+=3,0==C){for(;0!=(7&s);)s++;s=_.F._copyExact(o,f,$,u,s)}else{if(1==C&&(l=y.fltree,c=y.fdtree),2==C){_.F.makeCodes(y.ltree,d),_.F.revCodes(y.ltree,d),_.F.makeCodes(y.dtree,v),_.F.revCodes(y.dtree,v),_.F.makeCodes(y.itree,A),_.F.revCodes(y.itree,A),l=y.ltree,c=y.dtree,F(u,s,g-257),F(u,s+=5,p-1),F(u,s+=5,w-4),s+=4;for(var T=0;T<w;T++)F(u,s+3*T,y.itree[1+(y.ordr[T]<<1)]);s+=3*w,s=_.F._codeTiny(b,y.itree,u,s),s=_.F._codeTiny(m,y.itree,u,s)}for(var S=f,x=0;x<i;x+=2){for(var R=n[x],P=R>>>23,H=S+(8388607&R);S<H;)s=_.F._writeLit(o[S++],l,u,s);if(0!=P){var L=n[x+1],O=L>>16,k=L>>8&255,M=255&L;F(u,s=_.F._writeLit(257+k,l,u,s),P-y.of0[k]),s+=y.exb[k],E(u,s=_.F._writeLit(M,c,u,s),O-y.df0[M]),s+=y.dxb[M],S+=P}}s=_.F._writeLit(256,l,u,s)}return s},_.F._copyExact=function(r,n,i,a,o){var f=o>>>3;return a[f]=i,a[f+1]=i>>>8,a[f+2]=255-a[f],a[f+3]=255-a[f+1],f+=4,a.set(new Uint8Array(r.buffer,n,i),f),o+(i+4<<3)},_.F.getTrees=function(){for(var r=_.F.U,n=_.F._hufTree(r.lhst,r.ltree,15),i=_.F._hufTree(r.dhst,r.dtree,15),a=[],o=_.F._lenCodes(r.ltree,a),f=[],$=_.F._lenCodes(r.dtree,f),u=0;u<a.length;u+=2)r.ihst[a[u]]++;for(u=0;u<f.length;u+=2)r.ihst[f[u]]++;for(var s=_.F._hufTree(r.ihst,r.itree,7),l=19;l>4&&0==r.itree[1+(r.ordr[l-1]<<1)];)l--;return[n,i,s,o,$,l,a,f]},_.F.getSecond=function(r){for(var n=[],i=0;i<r.length;i+=2)n.push(r[i+1]);return n},_.F.nonZero=function(r){for(var n="",i=0;i<r.length;i+=2)0!=r[i+1]&&(n+=(i>>1)+",");return n},_.F.contSize=function(r,n){for(var i=0,a=0;a<n.length;a++)i+=n[a]*r[1+(a<<1)];return i},_.F._codeTiny=function(r,n,i,a){for(var o=0;o<r.length;o+=2){var f=r[o],$=r[o+1];a=_.F._writeLit(f,n,i,a);var u=16==f?2:17==f?3:7;f>15&&(_.F._putsE(i,a,$,u),a+=u)}return a},_.F._lenCodes=function(r,n){for(var i=r.length;2!=i&&0==r[i-1];)i-=2;for(var a=0;a<i;a+=2){var o=r[a+1],f=a+3<i?r[a+3]:-1,_=a+5<i?r[a+5]:-1,$=0==a?-1:r[a-1];if(0==o&&f==o&&_==o){for(var u=a+5;u+2<i&&r[u+2]==o;)u+=2;(s=Math.min(u+1-a>>>1,138))<11?n.push(17,s-3):n.push(18,s-11),a+=2*s-2}else if(o==$&&f==o&&_==o){for(u=a+5;u+2<i&&r[u+2]==o;)u+=2;var s=Math.min(u+1-a>>>1,6);n.push(16,s-3),a+=2*s-2}else n.push(o,0)}return i>>>1},_.F._hufTree=function(r,n,i){var a=[],o=r.length,f=n.length,$=0;for($=0;$<f;$+=2)n[$]=0,n[$+1]=0;for($=0;$<o;$++)0!=r[$]&&a.push({lit:$,f:r[$]});var u=a.length,s=a.slice(0);if(0==u)return 0;if(1==u){var l=a[0].lit;return s=0==l?1:0,n[1+(l<<1)]=1,n[1+(s<<1)]=1,1}a.sort(function(r,n){return r.f-n.f});var c=a[0],h=a[1],d=0,v=1,A=2;for(a[0]={lit:-1,f:c.f+h.f,l:c,r:h,d:0};v!=u-1;)c=d!=v&&(A==u||a[d].f<a[A].f)?a[d++]:a[A++],h=d!=v&&(A==u||a[d].f<a[A].f)?a[d++]:a[A++],a[v++]={lit:-1,f:c.f+h.f,l:c,r:h};var g=_.F.setDepth(a[v-1],0);for(g>i&&(_.F.restrictDepth(s,i,g),g=i),$=0;$<u;$++)n[1+(s[$].lit<<1)]=s[$].d;return g},_.F.setDepth=function(r,n){return -1!=r.lit?(r.d=n,n):Math.max(_.F.setDepth(r.l,n+1),_.F.setDepth(r.r,n+1))},_.F.restrictDepth=function(r,n,i){var a=0,o=1<<i-n,f=0;for(r.sort(function(r,n){return n.d==r.d?r.f-n.f:n.d-r.d}),a=0;a<r.length&&r[a].d>n;a++){var _=r[a].d;r[a].d=n,f+=o-(1<<i-_)}for(f>>>=i-n;f>0;)(_=r[a].d)<n?(r[a].d++,f-=1<<n-_-1):a++;for(;a>=0;a--)r[a].d==n&&f<0&&(r[a].d--,f++);0!=f&&console.log("debt left")},_.F._goodIndex=function(r,n){var i=0;return n[16|i]<=r&&(i|=16),n[8|i]<=r&&(i|=8),n[4|i]<=r&&(i|=4),n[2|i]<=r&&(i|=2),n[1|i]<=r&&(i|=1),i},_.F._writeLit=function(r,n,i,a){return _.F._putsF(i,a,n[r<<1]),a+n[1+(r<<1)]},_.F.inflate=function(r,n){var i=Uint8Array;if(3==r[0]&&0==r[1])return n||new i(0);var a=_.F,o=a._bitsF,f=a._bitsE,$=a._decodeTiny,u=a.makeCodes,s=a.codes2map,l=a._get17,c=a.U,h=null==n;h&&(n=new i(r.length>>>2<<3));for(var d,v,A=0,g=0,p=0,w=0,b=0,m=0,y=0,E=0,F=0;0==A;)if(A=o(r,F,1),g=o(r,F+1,2),F+=3,0!=g){if(h&&(n=_.F._check(n,E+131072)),1==g&&(d=c.flmap,v=c.fdmap,m=511,y=31),2==g){p=f(r,F,5)+257,w=f(r,F+5,5)+1,b=f(r,F+10,4)+4,F+=14;for(var B=0;B<38;B+=2)c.itree[B]=0,c.itree[B+1]=0;var Q=1;for(B=0;B<b;B++){var I=f(r,F+3*B,3);c.itree[1+(c.ordr[B]<<1)]=I,I>Q&&(Q=I)}F+=3*b,u(c.itree,Q),s(c.itree,Q,c.imap),d=c.lmap,v=c.dmap,F=$(c.imap,(1<<Q)-1,p+w,r,F,c.ttree);var U=a._copyOut(c.ttree,0,p,c.ltree);m=(1<<U)-1;var C=a._copyOut(c.ttree,p,w,c.dtree);y=(1<<C)-1,u(c.ltree,U),s(c.ltree,U,d),u(c.dtree,C),s(c.dtree,C,v)}for(;;){var T=d[l(r,F)&m];F+=15&T;var S=T>>>4;if(S>>>8==0)n[E++]=S;else{if(256==S)break;var x=E+S-254;if(S>264){var R=c.ldef[S-257];x=E+(R>>>3)+f(r,F,7&R),F+=7&R}var P=v[l(r,F)&y];F+=15&P;var H=P>>>4,L=c.ddef[H],O=(L>>>4)+o(r,F,15&L);for(F+=15&L,h&&(n=_.F._check(n,E+131072));E<x;)n[E]=n[E++-O],n[E]=n[E++-O],n[E]=n[E++-O],n[E]=n[E++-O];E=x}}}else{0!=(7&F)&&(F+=8-(7&F));var k=4+(F>>>3),M=r[k-4]|r[k-3]<<8;h&&(n=_.F._check(n,E+M)),n.set(new i(r.buffer,r.byteOffset+k,M),E),F=k+M<<3,E+=M}return n.length==E?n:n.slice(0,E)},_.F._check=function(r,n){var i=r.length;if(n<=i)return r;var a=new Uint8Array(Math.max(i<<1,n));return a.set(r,0),a},_.F._decodeTiny=function(r,n,i,a,o,f){for(var $=_.F._bitsE,u=_.F._get17,s=0;s<i;){var l=r[u(a,o)&n];o+=15&l;var c=l>>>4;if(c<=15)f[s]=c,s++;else{var h=0,d=0;16==c?(d=3+$(a,o,2),o+=2,h=f[s-1]):17==c?(d=3+$(a,o,3),o+=3):18==c&&(d=11+$(a,o,7),o+=7);for(var v=s+d;s<v;)f[s]=h,s++}}return o},_.F._copyOut=function(r,n,i,a){for(var o=0,f=0,_=a.length>>>1;f<i;){var $=r[f+n];a[f<<1]=0,a[1+(f<<1)]=$,$>o&&(o=$),f++}for(;f<_;)a[f<<1]=0,a[1+(f<<1)]=0,f++;return o},_.F.makeCodes=function(r,n){for(var i,a,o,f,$=_.F.U,u=r.length,s=$.bl_count,l=0;l<=n;l++)s[l]=0;for(l=1;l<u;l+=2)s[r[l]]++;var c=$.next_code;for(i=0,s[0]=0,a=1;a<=n;a++)i=i+s[a-1]<<1,c[a]=i;for(o=0;o<u;o+=2)0!=(f=r[o+1])&&(r[o]=c[f],c[f]++)},_.F.codes2map=function(r,n,i){for(var a=r.length,o=_.F.U.rev15,f=0;f<a;f+=2)if(0!=r[f+1])for(var $=f>>1,u=r[f+1],s=$<<4|u,l=n-u,c=r[f]<<l,h=c+(1<<l);c!=h;)i[o[c]>>>15-n]=s,c++},_.F.revCodes=function(r,n){for(var i=_.F.U.rev15,a=15-n,o=0;o<r.length;o+=2){var f=r[o]<<n-r[o+1];r[o]=i[f]>>>a}},_.F._putsE=function(r,n,i){i<<=7&n;var a=n>>>3;r[a]|=i,r[a+1]|=i>>>8},_.F._putsF=function(r,n,i){i<<=7&n;var a=n>>>3;r[a]|=i,r[a+1]|=i>>>8,r[a+2]|=i>>>16},_.F._bitsE=function(r,n,i){return(r[n>>>3]|r[1+(n>>>3)]<<8)>>>(7&n)&(1<<i)-1},_.F._bitsF=function(r,n,i){return(r[n>>>3]|r[1+(n>>>3)]<<8|r[2+(n>>>3)]<<16)>>>(7&n)&(1<<i)-1},_.F._get17=function(r,n){return(r[n>>>3]|r[1+(n>>>3)]<<8|r[2+(n>>>3)]<<16)>>>(7&n)},_.F._get25=function(r,n){return(r[n>>>3]|r[1+(n>>>3)]<<8|r[2+(n>>>3)]<<16|r[3+(n>>>3)]<<24)>>>(7&n)},_.F.U=(o=Uint16Array,f=Uint32Array,{next_code:new o(16),bl_count:new o(16),ordr:[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],of0:[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,999,999,999],exb:[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0],ldef:new o(32),df0:[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,65535,65535],dxb:[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0],ddef:new f(32),flmap:new o(512),fltree:[],fdmap:new o(32),fdtree:[],lmap:new o(32768),ltree:[],ttree:[],dmap:new o(32768),dtree:[],imap:new o(512),itree:[],rev15:new o(32768),lhst:new f(286),dhst:new f(30),ihst:new f(19),lits:new f(15e3),strt:new o(65536),prev:new o(32768)}),function(){for(var r=_.F.U,n=0;n<32768;n++){var i=n;i=(4278255360&(i=(4042322160&(i=(3435973836&(i=(2863311530&i)>>>1|(1431655765&i)<<1))>>>2|(858993459&i)<<2))>>>4|(252645135&i)<<4))>>>8|(16711935&i)<<8,r.rev15[n]=(i>>>16|i<<16)>>>17}function a(r,n,i){for(;0!=n--;)r.push(0,i)}for(n=0;n<32;n++)r.ldef[n]=r.of0[n]<<3|r.exb[n],r.ddef[n]=r.df0[n]<<4|r.dxb[n];a(r.fltree,144,8),a(r.fltree,112,9),a(r.fltree,24,7),a(r.fltree,8,8),_.F.makeCodes(r.fltree,9),_.F.codes2map(r.fltree,9,r.flmap),_.F.revCodes(r.fltree,9),a(r.fdtree,32,5),_.F.makeCodes(r.fdtree,5),_.F.codes2map(r.fdtree,5,r.fdmap),_.F.revCodes(r.fdtree,5),a(r.itree,19,0),a(r.ltree,286,0),a(r.dtree,30,0),a(r.ttree,320,0)}();var c=($={__proto__:null,default:l},(u=[l]).forEach(function(r){r&&"string"!=typeof r&&!Array.isArray(r)&&Object.keys(r).forEach(function(n){if("default"!==n&&!(n in $)){var i=Object.getOwnPropertyDescriptor(r,n);Object.defineProperty($,n,i.get?i:{enumerable:!0,get:function i(){return r[n]}})}})}),Object.freeze($)),h=function(){var r={nextZero:function r(n,i){for(;0!=n[i];)i++;return i},readUshort:function r(n,i){return n[i]<<8|n[i+1]},writeUshort:function r(n,i,a){n[i]=a>>8&255,n[i+1]=255&a},readUint:function r(n,i){return 16777216*n[i]+(n[i+1]<<16|n[i+2]<<8|n[i+3])},writeUint:function r(n,i,a){n[i]=a>>24&255,n[i+1]=a>>16&255,n[i+2]=a>>8&255,n[i+3]=255&a},readASCII:function r(n,i,a){for(var o="",f=0;f<a;f++)o+=String.fromCharCode(n[i+f]);return o},writeASCII:function r(n,i,a){for(var o=0;o<a.length;o++)n[i+o]=a.charCodeAt(o)},readBytes:function r(n,i,a){for(var o=[],f=0;f<a;f++)o.push(n[i+f]);return o},pad:function r(n){return n.length<2?"0".concat(n):n},readUTF8:function n(i,a,o){for(var f,_="",$=0;$<o;$++)_+="%".concat(r.pad(i[a+$].toString(16)));try{f=decodeURIComponent(_)}catch(u){return r.readASCII(i,a,o)}return f}};function n(n,i,a,o){var f=i*a,_=Math.ceil(i*u(o)/8),$=new Uint8Array(4*f),s=new Uint32Array($.buffer),l=o.ctype,c=o.depth,h=r.readUshort;if(6==l){var d=f<<2;if(8==c)for(var v=0;v<d;v+=4)$[v]=n[v],$[v+1]=n[v+1],$[v+2]=n[v+2],$[v+3]=n[v+3];if(16==c)for(v=0;v<d;v++)$[v]=n[v<<1]}else if(2==l){var A=o.tabs.tRNS;if(null==A){if(8==c)for(v=0;v<f;v++){var g=3*v;s[v]=-16777216|n[g+2]<<16|n[g+1]<<8|n[g]}if(16==c)for(v=0;v<f;v++)g=6*v,s[v]=-16777216|n[g+4]<<16|n[g+2]<<8|n[g]}else{var p=A[0],w=A[1],b=A[2];if(8==c)for(v=0;v<f;v++){var m=v<<2;g=3*v,s[v]=-16777216|n[g+2]<<16|n[g+1]<<8|n[g],n[g]==p&&n[g+1]==w&&n[g+2]==b&&($[m+3]=0)}if(16==c)for(v=0;v<f;v++)m=v<<2,g=6*v,s[v]=-16777216|n[g+4]<<16|n[g+2]<<8|n[g],h(n,g)==p&&h(n,g+2)==w&&h(n,g+4)==b&&($[m+3]=0)}}else if(3==l){var y,E=o.tabs.PLTE,F=o.tabs.tRNS,B=F?F.length:0;if(1==c)for(var Q=0;Q<a;Q++){var I=Q*_,U=Q*i;for(v=0;v<i;v++){m=U+v<<2;var C=3*(y=n[I+(v>>3)]>>7-((7&v)<<0)&1);$[m]=E[C],$[m+1]=E[C+1],$[m+2]=E[C+2],$[m+3]=y<B?F[y]:255}}if(2==c)for(Q=0;Q<a;Q++)for(I=Q*_,U=Q*i,v=0;v<i;v++)m=U+v<<2,C=3*(y=n[I+(v>>2)]>>6-((3&v)<<1)&3),$[m]=E[C],$[m+1]=E[C+1],$[m+2]=E[C+2],$[m+3]=y<B?F[y]:255;if(4==c)for(Q=0;Q<a;Q++)for(I=Q*_,U=Q*i,v=0;v<i;v++)m=U+v<<2,C=3*(y=n[I+(v>>1)]>>4-((1&v)<<2)&15),$[m]=E[C],$[m+1]=E[C+1],$[m+2]=E[C+2],$[m+3]=y<B?F[y]:255;if(8==c)for(v=0;v<f;v++)m=v<<2,C=3*(y=n[v]),$[m]=E[C],$[m+1]=E[C+1],$[m+2]=E[C+2],$[m+3]=y<B?F[y]:255}else if(4==l){if(8==c)for(v=0;v<f;v++){m=v<<2;var T,S=n[T=v<<1];$[m]=S,$[m+1]=S,$[m+2]=S,$[m+3]=n[T+1]}if(16==c)for(v=0;v<f;v++)m=v<<2,S=n[T=v<<2],$[m]=S,$[m+1]=S,$[m+2]=S,$[m+3]=n[T+2]}else if(0==l)for(p=o.tabs.tRNS?o.tabs.tRNS:-1,Q=0;Q<a;Q++){var x=Q*_,R=Q*i;if(1==c)for(var P=0;P<i;P++){var H=(S=255*(n[x+(P>>>3)]>>>7-(7&P)&1))==255*p?0:255;s[R+P]=H<<24|S<<16|S<<8|S}else if(2==c)for(P=0;P<i;P++)H=(S=85*(n[x+(P>>>2)]>>>6-((3&P)<<1)&3))==85*p?0:255,s[R+P]=H<<24|S<<16|S<<8|S;else if(4==c)for(P=0;P<i;P++)H=(S=17*(n[x+(P>>>1)]>>>4-((1&P)<<2)&15))==17*p?0:255,s[R+P]=H<<24|S<<16|S<<8|S;else if(8==c)for(P=0;P<i;P++)H=(S=n[x+P])==p?0:255,s[R+P]=H<<24|S<<16|S<<8|S;else if(16==c)for(P=0;P<i;P++)S=n[x+(P<<1)],H=h(n,x+(P<<1))==p?0:255,s[R+P]=H<<24|S<<16|S<<8|S}return $}function i(r,n,i,o){var f=u(r),_=new Uint8Array((Math.ceil(i*f/8)+1+r.interlace)*o);return n=r.tabs.CgBI?$(n,_):a(n,_),0==r.interlace?n=s(n,r,0,i,o):1==r.interlace&&(n=function r(n,i){for(var a=i.width,o=i.height,f=u(i),_=f>>3,$=Math.ceil(a*f/8),l=new Uint8Array(o*$),c=0,h=[0,0,4,0,2,0,1],d=[0,4,0,2,0,1,0],v=[8,8,8,4,4,2,2],A=[8,8,4,4,2,2,1],g=0;g<7;){for(var p=v[g],w=A[g],b=0,m=0,y=h[g];y<o;)y+=p,m++;for(var E=d[g];E<a;)E+=w,b++;var F=Math.ceil(b*f/8);s(n,i,c,b,m);for(var B=0,Q=h[g];Q<o;){for(var I,U=d[g],C=c+B*F<<3;U<a;){if(1==f&&(I=(I=n[C>>3])>>7-(7&C)&1,l[Q*$+(U>>3)]|=I<<7-((7&U)<<0)),2==f&&(I=(I=n[C>>3])>>6-(7&C)&3,l[Q*$+(U>>2)]|=I<<6-((3&U)<<1)),4==f&&(I=(I=n[C>>3])>>4-(7&C)&15,l[Q*$+(U>>1)]|=I<<4-((1&U)<<2)),f>=8)for(var T=Q*$+U*_,S=0;S<_;S++)l[T+S]=n[(C>>3)+S];C+=f,U+=w}B++,Q+=p}b*m!=0&&(c+=m*(1+F)),g+=1}return l}(n,r)),n}function a(r,n){return $(new Uint8Array(r.buffer,2,r.length-6),n)}var o,f,_,$=((o={H:{}}).H.N=function(r,n){var i,a,f=Uint8Array,_=0,$=0,u=0,s=0,l=0,c=0,h=0,d=0,v=0;if(3==r[0]&&0==r[1])return n||new f(0);var A=o.H,g=A.b,p=A.e,w=A.R,b=A.n,m=A.A,y=A.Z,E=A.m,F=null==n;for(F&&(n=new f(r.length>>>2<<5));0==_;)if(_=g(r,v,1),$=g(r,v+1,2),v+=3,0!=$){if(F&&(n=o.H.W(n,d+131072)),1==$&&(i=E.J,a=E.h,c=511,h=31),2==$){u=p(r,v,5)+257,s=p(r,v+5,5)+1,l=p(r,v+10,4)+4,v+=14;for(var B=1,Q=0;Q<38;Q+=2)E.Q[Q]=0,E.Q[Q+1]=0;for(Q=0;Q<l;Q++){var I=p(r,v+3*Q,3);E.Q[1+(E.X[Q]<<1)]=I,I>B&&(B=I)}v+=3*l,b(E.Q,B),m(E.Q,B,E.u),i=E.w,a=E.d,v=w(E.u,(1<<B)-1,u+s,r,v,E.v);var U=A.V(E.v,0,u,E.C);c=(1<<U)-1;var C=A.V(E.v,u,s,E.D);h=(1<<C)-1,b(E.C,U),m(E.C,U,i),b(E.D,C),m(E.D,C,a)}for(;;){var T=i[y(r,v)&c];v+=15&T;var S=T>>>4;if(S>>>8==0)n[d++]=S;else{if(256==S)break;var x=d+S-254;if(S>264){var R=E.q[S-257];x=d+(R>>>3)+p(r,v,7&R),v+=7&R}var P=a[y(r,v)&h];v+=15&P;var H=P>>>4,L=E.c[H],O=(L>>>4)+g(r,v,15&L);for(v+=15&L;d<x;)n[d]=n[d++-O],n[d]=n[d++-O],n[d]=n[d++-O],n[d]=n[d++-O];d=x}}}else{0!=(7&v)&&(v+=8-(7&v));var k=4+(v>>>3),M=r[k-4]|r[k-3]<<8;F&&(n=o.H.W(n,d+M)),n.set(new f(r.buffer,r.byteOffset+k,M),d),v=k+M<<3,d+=M}return n.length==d?n:n.slice(0,d)},o.H.W=function(r,n){var i=r.length;if(n<=i)return r;var a=new Uint8Array(i<<1);return a.set(r,0),a},o.H.R=function(r,n,i,a,f,_){for(var $=o.H.e,u=o.H.Z,s=0;s<i;){var l=r[u(a,f)&n];f+=15&l;var c=l>>>4;if(c<=15)_[s]=c,s++;else{var h=0,d=0;16==c?(d=3+$(a,f,2),f+=2,h=_[s-1]):17==c?(d=3+$(a,f,3),f+=3):18==c&&(d=11+$(a,f,7),f+=7);for(var v=s+d;s<v;)_[s]=h,s++}}return f},o.H.V=function(r,n,i,a){for(var o=0,f=0,_=a.length>>>1;f<i;){var $=r[f+n];a[f<<1]=0,a[1+(f<<1)]=$,$>o&&(o=$),f++}for(;f<_;)a[f<<1]=0,a[1+(f<<1)]=0,f++;return o},o.H.n=function(r,n){for(var i,a,f,_,$=o.H.m,u=r.length,s=$.j,l=0;l<=n;l++)s[l]=0;for(l=1;l<u;l+=2)s[r[l]]++;var c=$.K;for(i=0,s[0]=0,a=1;a<=n;a++)i=i+s[a-1]<<1,c[a]=i;for(f=0;f<u;f+=2)0!=(_=r[f+1])&&(r[f]=c[_],c[_]++)},o.H.A=function(r,n,i){for(var a=r.length,f=o.H.m.r,_=0;_<a;_+=2)if(0!=r[_+1])for(var $=_>>1,u=r[_+1],s=$<<4|u,l=n-u,c=r[_]<<l,h=c+(1<<l);c!=h;)i[f[c]>>>15-n]=s,c++},o.H.l=function(r,n){for(var i=o.H.m.r,a=15-n,f=0;f<r.length;f+=2){var _=r[f]<<n-r[f+1];r[f]=i[_]>>>a}},o.H.M=function(r,n,i){i<<=7&n;var a=n>>>3;r[a]|=i,r[a+1]|=i>>>8},o.H.I=function(r,n,i){i<<=7&n;var a=n>>>3;r[a]|=i,r[a+1]|=i>>>8,r[a+2]|=i>>>16},o.H.e=function(r,n,i){return(r[n>>>3]|r[1+(n>>>3)]<<8)>>>(7&n)&(1<<i)-1},o.H.b=function(r,n,i){return(r[n>>>3]|r[1+(n>>>3)]<<8|r[2+(n>>>3)]<<16)>>>(7&n)&(1<<i)-1},o.H.Z=function(r,n){return(r[n>>>3]|r[1+(n>>>3)]<<8|r[2+(n>>>3)]<<16)>>>(7&n)},o.H.i=function(r,n){return(r[n>>>3]|r[1+(n>>>3)]<<8|r[2+(n>>>3)]<<16|r[3+(n>>>3)]<<24)>>>(7&n)},o.H.m=(f=Uint16Array,_=Uint32Array,{K:new f(16),j:new f(16),X:[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],S:[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,999,999,999],T:[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0],q:new f(32),p:[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,65535,65535],z:[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0],c:new _(32),J:new f(512),_:[],h:new f(32),$:[],w:new f(32768),C:[],v:[],d:new f(32768),D:[],u:new f(512),Q:[],r:new f(32768),s:new _(286),Y:new _(30),a:new _(19),t:new _(15e3),k:new f(65536),g:new f(32768)}),function(){for(var r=o.H.m,n=0;n<32768;n++){var i=n;i=(4278255360&(i=(4042322160&(i=(3435973836&(i=(2863311530&i)>>>1|(1431655765&i)<<1))>>>2|(858993459&i)<<2))>>>4|(252645135&i)<<4))>>>8|(16711935&i)<<8,r.r[n]=(i>>>16|i<<16)>>>17}function a(r,n,i){for(;0!=n--;)r.push(0,i)}for(n=0;n<32;n++)r.q[n]=r.S[n]<<3|r.T[n],r.c[n]=r.p[n]<<4|r.z[n];a(r._,144,8),a(r._,112,9),a(r._,24,7),a(r._,8,8),o.H.n(r._,9),o.H.A(r._,9,r.J),o.H.l(r._,9),a(r.$,32,5),o.H.n(r.$,5),o.H.A(r.$,5,r.h),o.H.l(r.$,5),a(r.Q,19,0),a(r.C,286,0),a(r.D,30,0),a(r.v,320,0)}(),o.H.N);function u(r){return[1,null,3,1,2,null,4][r.ctype]*r.depth}function s(r,n,i,a,o){var f,_,$=u(n),s=Math.ceil(a*$/8);$=Math.ceil($/8);var c=r[i],h=0;if(c>1&&(r[i]=[0,0,1][c-2]),3==c)for(h=$;h<s;h++)r[h+1]=r[h+1]+(r[h+1-$]>>>1)&255;for(var d=0;d<o;d++)if(c=r[(_=(f=i+d*s)+d+1)-1],h=0,0==c)for(;h<s;h++)r[f+h]=r[_+h];else if(1==c){for(;h<$;h++)r[f+h]=r[_+h];for(;h<s;h++)r[f+h]=r[_+h]+r[f+h-$]}else if(2==c)for(;h<s;h++)r[f+h]=r[_+h]+r[f+h-s];else if(3==c){for(;h<$;h++)r[f+h]=r[_+h]+(r[f+h-s]>>>1);for(;h<s;h++)r[f+h]=r[_+h]+(r[f+h-s]+r[f+h-$]>>>1)}else{for(;h<$;h++)r[f+h]=r[_+h]+l(0,r[f+h-s],0);for(;h<s;h++)r[f+h]=r[_+h]+l(r[f+h-$],r[f+h-s],r[f+h-$-s])}return r}function l(r,n,i){var a=r+n-i,o=a-r,f=a-n,_=a-i;return o*o<=f*f&&o*o<=_*_?r:f*f<=_*_?n:i}function c(n,i,a){a.width=r.readUint(n,i),i+=4,a.height=r.readUint(n,i),i+=4,a.depth=n[i],i++,a.ctype=n[i],i++,a.compress=n[i],i++,a.filter=n[i],i++,a.interlace=n[i],i++}function h(r,n,i,a,o,f,_,$,u){for(var s=Math.min(n,o),l=Math.min(i,f),c=0,h=0,d=0;d<l;d++)for(var v=0;v<s;v++)if(_>=0&&$>=0?(c=d*n+v<<2,h=($+d)*o+_+v<<2):(c=(-$+d)*n-_+v<<2,h=d*o+v<<2),0==u)a[h]=r[c],a[h+1]=r[c+1],a[h+2]=r[c+2],a[h+3]=r[c+3];else if(1==u){var A=r[c+3]*(1/255),g=r[c]*A,p=r[c+1]*A,w=r[c+2]*A,b=a[h+3]*(1/255),m=a[h]*b,y=a[h+1]*b,E=a[h+2]*b,F=1-A,B=A+b*F,Q=0==B?0:1/B;a[h+3]=255*B,a[h+0]=(g+m*F)*Q,a[h+1]=(p+y*F)*Q,a[h+2]=(w+E*F)*Q}else if(2==u)A=r[c+3],g=r[c],p=r[c+1],w=r[c+2],b=a[h+3],m=a[h],y=a[h+1],E=a[h+2],A==b&&g==m&&p==y&&w==E?(a[h]=0,a[h+1]=0,a[h+2]=0,a[h+3]=0):(a[h]=g,a[h+1]=p,a[h+2]=w,a[h+3]=A);else if(3==u){if(A=r[c+3],g=r[c],p=r[c+1],w=r[c+2],b=a[h+3],m=a[h],y=a[h+1],E=a[h+2],A==b&&g==m&&p==y&&w==E)continue;if(A<220&&b>20)return!1}return!0}return{decode:function n(o){for(var f,_,u=new Uint8Array(o),s=8,l=r,h=l.readUshort,d=l.readUint,v={tabs:{},frames:[]},A=new Uint8Array(u.length),g=0,p=0,w=[137,80,78,71,13,10,26,10],b=0;b<8;b++)if(u[b]!=w[b])throw"The input is not a PNG file!";for(;s<u.length;){var m=l.readUint(u,s);s+=4;var y=l.readASCII(u,s,4);if(s+=4,"IHDR"==y)c(u,s,v);else if("iCCP"==y){for(var E=s;0!=u[E];)E++;l.readASCII(u,s,E-s),u[E+1];var F=u.slice(E+2,s+m),B=null;try{B=a(F)}catch(Q){B=$(F)}v.tabs[y]=B}else if("CgBI"==y)v.tabs[y]=u.slice(s,s+4);else if("IDAT"==y){for(b=0;b<m;b++)A[g+b]=u[s+b];g+=m}else if("acTL"==y)v.tabs[y]={num_frames:d(u,s),num_plays:d(u,s+4)},_=new Uint8Array(u.length);else if("fcTL"==y){0!=p&&((f=v.frames[v.frames.length-1]).data=i(v,_.slice(0,p),f.rect.width,f.rect.height),p=0);var I={x:d(u,s+12),y:d(u,s+16),width:d(u,s+4),height:d(u,s+8)},U=h(u,s+22);U=h(u,s+20)/(0==U?100:U);var C={rect:I,delay:Math.round(1e3*U),dispose:u[s+24],blend:u[s+25]};v.frames.push(C)}else if("fdAT"==y){for(b=0;b<m-4;b++)_[p+b]=u[s+b+4];p+=m-4}else if("pHYs"==y)v.tabs[y]=[l.readUint(u,s),l.readUint(u,s+4),u[s+8]];else if("cHRM"==y)for(b=0,v.tabs[y]=[];b<8;b++)v.tabs[y].push(l.readUint(u,s+4*b));else if("tEXt"==y||"zTXt"==y){null==v.tabs[y]&&(v.tabs[y]={});var T=l.nextZero(u,s),S=l.readASCII(u,s,T-s),x=s+m-T-1;if("tEXt"==y)P=l.readASCII(u,T+1,x);else{var R=a(u.slice(T+2,T+2+x));P=l.readUTF8(R,0,R.length)}v.tabs[y][S]=P}else if("iTXt"==y){null==v.tabs[y]&&(v.tabs[y]={}),T=0,E=s,T=l.nextZero(u,E),S=l.readASCII(u,E,T-E);var P,H=u[E=T+1];u[E+1],E+=2,T=l.nextZero(u,E),l.readASCII(u,E,T-E),E=T+1,T=l.nextZero(u,E),l.readUTF8(u,E,T-E),x=m-((E=T+1)-s),0==H?P=l.readUTF8(u,E,x):(R=a(u.slice(E,E+x)),P=l.readUTF8(R,0,R.length)),v.tabs[y][S]=P}else if("PLTE"==y)v.tabs[y]=l.readBytes(u,s,m);else if("hIST"==y){var L=v.tabs.PLTE.length/3;for(b=0,v.tabs[y]=[];b<L;b++)v.tabs[y].push(h(u,s+2*b))}else if("tRNS"==y)3==v.ctype?v.tabs[y]=l.readBytes(u,s,m):0==v.ctype?v.tabs[y]=h(u,s):2==v.ctype&&(v.tabs[y]=[h(u,s),h(u,s+2),h(u,s+4)]);else if("gAMA"==y)v.tabs[y]=l.readUint(u,s)/1e5;else if("sRGB"==y)v.tabs[y]=u[s];else if("bKGD"==y)0==v.ctype||4==v.ctype?v.tabs[y]=[h(u,s)]:2==v.ctype||6==v.ctype?v.tabs[y]=[h(u,s),h(u,s+2),h(u,s+4)]:3==v.ctype&&(v.tabs[y]=u[s]);else if("IEND"==y)break;s+=m,l.readUint(u,s),s+=4}return 0!=p&&((f=v.frames[v.frames.length-1]).data=i(v,_.slice(0,p),f.rect.width,f.rect.height)),v.data=i(v,A,v.width,v.height),delete v.compress,delete v.interlace,delete v.filter,v},toRGBA8:function r(i){var a=i.width,o=i.height;if(null==i.tabs.acTL)return[n(i.data,a,o,i).buffer];var f=[];null==i.frames[0].data&&(i.frames[0].data=i.data);for(var _=a*o*4,$=new Uint8Array(_),u=new Uint8Array(_),s=new Uint8Array(_),l=0;l<i.frames.length;l++){var c=i.frames[l],d=c.rect.x,v=c.rect.y,A=c.rect.width,g=c.rect.height,p=n(c.data,A,g,i);if(0!=l)for(var w=0;w<_;w++)s[w]=$[w];if(0==c.blend?h(p,A,g,$,a,o,d,v,0):1==c.blend&&h(p,A,g,$,a,o,d,v,1),f.push($.buffer.slice(0)),0==c.dispose);else if(1==c.dispose)h(u,A,g,$,a,o,d,v,0);else if(2==c.dispose)for(w=0;w<_;w++)$[w]=s[w]}return f},_paeth:l,_copyTile:h,_bin:r}}();!function(){var r=h._copyTile,n=h._bin,i=h._paeth,a={table:function(){for(var r=new Uint32Array(256),n=0;n<256;n++){for(var i=n,a=0;a<8;a++)1&i?i=3988292384^i>>>1:i>>>=1;r[n]=i}return r}(),update:function r(n,i,o,f){for(var _=0;_<f;_++)n=a.table[255&(n^i[o+_])]^n>>>8;return n},crc:function r(n,i,o){return 4294967295^a.update(4294967295,n,i,o)}};function o(r,n,i,a){n[i]+=r[0]*a>>4,n[i+1]+=r[1]*a>>4,n[i+2]+=r[2]*a>>4,n[i+3]+=r[3]*a>>4}function f(r){return Math.max(0,Math.min(255,r))}function _(r,n){var i=r[0]-n[0],a=r[1]-n[1],o=r[2]-n[2],f=r[3]-n[3];return i*i+a*a+o*o+f*f}function $(r,n,i,a,$,u,s){null==s&&(s=1);for(var l=a.length,c=[],h=0;h<l;h++){var d=a[h];c.push([d>>>0&255,d>>>8&255,d>>>16&255,d>>>24&255])}for(h=0;h<l;h++)for(var v=4294967295,A=0,g=0;g<l;g++){var p=_(c[h],c[g]);g!=h&&p<v&&(v=p,A=g)}var w=new Uint32Array($.buffer),b=new Int16Array(n*i*4),m=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];for(h=0;h<m.length;h++)m[h]=255*((m[h]+.5)/16-.5);for(var y=0;y<i;y++)for(var E=0;E<n;E++){h=4*(y*n+E),2!=s?F=[f(r[h]+b[h]),f(r[h+1]+b[h+1]),f(r[h+2]+b[h+2]),f(r[h+3]+b[h+3])]:(p=m[4*(3&y)+(3&E)],F=[f(r[h]+p),f(r[h+1]+p),f(r[h+2]+p),f(r[h+3]+p)]),A=0;var F,B=16777215;for(g=0;g<l;g++){var Q=_(F,c[g]);Q<B&&(B=Q,A=g)}var I=c[A],U=[F[0]-I[0],F[1]-I[1],F[2]-I[2],F[3]-I[3]];1==s&&(E!=n-1&&o(U,b,h+4,7),y!=i-1&&(0!=E&&o(U,b,h+4*n-4,3),o(U,b,h+4*n,5),E!=n-1&&o(U,b,h+4*n+4,1))),u[h>>2]=A,w[h>>2]=a[A]}}function u(r,i,o,f,_){null==_&&(_={});var $,u=a.crc,s=n.writeUint,l=n.writeUshort,c=n.writeASCII,h=8,d=r.frames.length>1,v=!1,A=33+(d?20:0);if(null!=_.sRGB&&(A+=13),null!=_.pHYs&&(A+=21),null!=_.iCCP&&(A+=21+($=pako.deflate(_.iCCP)).length+4),3==r.ctype){for(var g=r.plte.length,p=0;p<g;p++)r.plte[p]>>>24!=255&&(v=!0);A+=8+3*g+4+(v?8+1*g+4:0)}for(var w=0;w<r.frames.length;w++)d&&(A+=38),A+=(C=r.frames[w]).cimg.length+12,0!=w&&(A+=4);A+=12;var b=new Uint8Array(A),m=[137,80,78,71,13,10,26,10];for(p=0;p<8;p++)b[p]=m[p];if(s(b,h,13),c(b,h+=4,"IHDR"),s(b,h+=4,i),s(b,h+=4,o),b[h+=4]=r.depth,b[++h]=r.ctype,b[++h]=0,b[++h]=0,b[++h]=0,s(b,++h,u(b,h-17,17)),h+=4,null!=_.sRGB&&(s(b,h,1),c(b,h+=4,"sRGB"),b[h+=4]=_.sRGB,s(b,++h,u(b,h-5,5)),h+=4),null!=_.iCCP){var y=13+$.length;s(b,h,y),c(b,h+=4,"iCCP"),c(b,h+=4,"ICC profile"),h+=11,h+=2,b.set($,h),s(b,h+=$.length,u(b,h-(y+4),y+4)),h+=4}if(null!=_.pHYs&&(s(b,h,9),c(b,h+=4,"pHYs"),s(b,h+=4,_.pHYs[0]),s(b,h+=4,_.pHYs[1]),b[h+=4]=_.pHYs[2],s(b,++h,u(b,h-13,13)),h+=4),d&&(s(b,h,8),c(b,h+=4,"acTL"),s(b,h+=4,r.frames.length),s(b,h+=4,null!=_.loop?_.loop:0),s(b,h+=4,u(b,h-12,12)),h+=4),3==r.ctype){for(s(b,h,3*(g=r.plte.length)),c(b,h+=4,"PLTE"),h+=4,p=0;p<g;p++){var E=3*p,F=r.plte[p],B=255&F,Q=F>>>8&255,I=F>>>16&255;b[h+E+0]=B,b[h+E+1]=Q,b[h+E+2]=I}if(s(b,h+=3*g,u(b,h-3*g-4,3*g+4)),h+=4,v){for(s(b,h,g),c(b,h+=4,"tRNS"),h+=4,p=0;p<g;p++)b[h+p]=r.plte[p]>>>24&255;s(b,h+=g,u(b,h-g-4,g+4)),h+=4}}var U=0;for(w=0;w<r.frames.length;w++){var C=r.frames[w];d&&(s(b,h,26),c(b,h+=4,"fcTL"),s(b,h+=4,U++),s(b,h+=4,C.rect.width),s(b,h+=4,C.rect.height),s(b,h+=4,C.rect.x),s(b,h+=4,C.rect.y),l(b,h+=4,f[w]),l(b,h+=2,1e3),b[h+=2]=C.dispose,b[++h]=C.blend,s(b,++h,u(b,h-30,30)),h+=4);var T=C.cimg;s(b,h,(g=T.length)+(0==w?0:4));var S=h+=4;c(b,h,0==w?"IDAT":"fdAT"),h+=4,0!=w&&(s(b,h,U++),h+=4),b.set(T,h),s(b,h+=g,u(b,S,h-S)),h+=4}return s(b,h,0),c(b,h+=4,"IEND"),s(b,h+=4,u(b,h-4,4)),h+=4,b.buffer}function s(r,n,i){for(var a=0;a<r.frames.length;a++){var o=r.frames[a];o.rect.width;var f=o.rect.height,_=new Uint8Array(f*o.bpl+f);o.cimg=A(o.img,f,o.bpp,o.bpl,_,n,i)}}function l(n,i,a,o,f){for(var _=f[0],u=f[1],s=f[2],l=f[3],c=f[4],h=f[5],A=6,g=8,w=255,b=0;b<n.length;b++)for(var m=new Uint8Array(n[b]),y=m.length,E=0;E<y;E+=4)w&=m[E+3];var F=255!=w,B=function n(i,a,o,f,_,$){for(var u,s=[],l=0;l<i.length;l++){var c,h=new Uint8Array(i[l]),A=new Uint32Array(h.buffer),g=0,p=0,w=a,b=o,m=f?1:0;if(0!=l){for(var y=$||f||1==l||0!=s[l-2].dispose?1:2,E=0,F=1e9,B=0;B<y;B++){for(var Q=new Uint8Array(i[l-1-B]),I=new Uint32Array(i[l-1-B]),U=a,C=o,T=-1,S=-1,x=0;x<o;x++)for(var R=0;R<a;R++)A[z=x*a+R]!=I[z]&&(R<U&&(U=R),R>T&&(T=R),x<C&&(C=x),x>S&&(S=x));-1==T&&(U=C=T=S=0),_&&(1==(1&U)&&U--,1==(1&C)&&C--);var P=(T-U+1)*(S-C+1);P<F&&(F=P,E=B,g=U,p=C,w=T-U+1,b=S-C+1)}Q=new Uint8Array(i[l-1-E]),1==E&&(s[l-1].dispose=2),c=new Uint8Array(w*b*4),r(Q,a,o,c,w,b,-g,-p,0),1==(m=r(h,a,o,c,w,b,-g,-p,3)?1:0)?v(h,a,o,c,{x:g,y:p,width:w,height:b}):r(h,a,o,c,w,b,-g,-p,0)}else c=h.slice(0);s.push({rect:{x:g,y:p,width:w,height:b},img:c,blend:m,dispose:0})}if(f){for(l=0;l<s.length;l++)if(1!=(u=s[l]).blend){var H=u.rect,L=s[l-1].rect,O=Math.min(H.x,L.x),k=Math.min(H.y,L.y),M={x:O,y:k,width:Math.max(H.x+H.width,L.x+L.width)-O,height:Math.max(H.y+H.height,L.y+L.height)-k};s[l-1].dispose=1,l-1!=0&&d(i,a,o,s,l-1,M,_),d(i,a,o,s,l,M,_)}}var D=0;if(1!=i.length)for(var z=0;z<s.length;z++)D+=(u=s[z]).rect.width*u.rect.height;return s}(n,i,a,_,u,s),Q={},I=[],U=[];if(0!=o){var C=[];for(E=0;E<B.length;E++)C.push(B[E].img.buffer);var T=function r(n){for(var i=0,a=0;a<n.length;a++)i+=n[a].byteLength;var o=new Uint8Array(i),f=0;for(a=0;a<n.length;a++){for(var _=new Uint8Array(n[a]),$=_.length,u=0;u<$;u+=4){var s=_[u],l=_[u+1],c=_[u+2],h=_[u+3];0==h&&(s=l=c=0),o[f+u]=s,o[f+u+1]=l,o[f+u+2]=c,o[f+u+3]=h}f+=$}return o.buffer}(C),S=p(T,o);for(E=0;E<S.plte.length;E++)I.push(S.plte[E].est.rgba);var x=0;for(E=0;E<B.length;E++){var R=(L=B[E]).img.length,P=new Uint8Array(S.inds.buffer,x>>2,R>>2);U.push(P);var H=new Uint8Array(S.abuf,x,R);h&&$(L.img,L.rect.width,L.rect.height,I,H,P),L.img.set(H),x+=R}}else for(b=0;b<B.length;b++){var L=B[b],O=new Uint32Array(L.img.buffer),k=L.rect.width;for(y=O.length,P=new Uint8Array(y),U.push(P),E=0;E<y;E++){var M=O[E];if(0!=E&&M==O[E-1])P[E]=P[E-1];else if(E>k&&M==O[E-k])P[E]=P[E-k];else{var D=Q[M];if(null==D&&(Q[M]=D=I.length,I.push(M),I.length>=300))break;P[E]=D}}}var z=I.length;for(z<=256&&0==c&&(g=Math.max(g=z<=2?1:z<=4?2:z<=16?4:8,l)),b=0;b<B.length;b++){(L=B[b]).rect.x,L.rect.y,k=L.rect.width;var N=L.rect.height,j=L.img;new Uint32Array(j.buffer);var K=4*k,q=4;if(z<=256&&0==c){K=Math.ceil(g*k/8);for(var W=new Uint8Array(K*N),X=U[b],Y=0;Y<N;Y++){E=Y*K;var Z=Y*k;if(8==g)for(var G=0;G<k;G++)W[E+G]=X[Z+G];else if(4==g)for(G=0;G<k;G++)W[E+(G>>1)]|=X[Z+G]<<4-4*(1&G);else if(2==g)for(G=0;G<k;G++)W[E+(G>>2)]|=X[Z+G]<<6-2*(3&G);else if(1==g)for(G=0;G<k;G++)W[E+(G>>3)]|=X[Z+G]<<7-1*(7&G)}j=W,A=3,q=1}else if(0==F&&1==B.length){W=new Uint8Array(k*N*3);var V=k*N;for(E=0;E<V;E++){var J=3*E,ee=4*E;W[J]=j[ee],W[J+1]=j[ee+1],W[J+2]=j[ee+2]}j=W,A=2,q=3,K=3*k}L.img=j,L.bpl=K,L.bpp=q}return{ctype:A,depth:g,plte:I,frames:B}}function d(n,i,a,o,f,_,$){for(var u=Uint8Array,s=Uint32Array,l=new u(n[f-1]),c=new s(n[f-1]),h=f+1<n.length?new u(n[f+1]):null,d=new u(n[f]),A=new s(d.buffer),g=i,p=a,w=-1,b=-1,m=0;m<_.height;m++)for(var y=0;y<_.width;y++){var E=_.x+y,F=_.y+m,B=F*i+E,Q=A[B];0==Q||0==o[f-1].dispose&&c[B]==Q&&(null==h||0!=h[4*B+3])||(E<g&&(g=E),E>w&&(w=E),F<p&&(p=F),F>b&&(b=F))}-1==w&&(g=p=w=b=0),$&&(1==(1&g)&&g--,1==(1&p)&&p--),_={x:g,y:p,width:w-g+1,height:b-p+1};var I=o[f];I.rect=_,I.blend=1,I.img=new Uint8Array(_.width*_.height*4),0==o[f-1].dispose?(r(l,i,a,I.img,_.width,_.height,-_.x,-_.y,0),v(d,i,a,I.img,_)):r(d,i,a,I.img,_.width,_.height,-_.x,-_.y,0)}function v(n,i,a,o,f){r(n,i,a,o,f.width,f.height,-f.x,-f.y,2)}function A(r,n,i,a,o,f,_){var $,u=[],s=[0,1,2,3,4];-1!=f?s=[f]:(n*a>5e5||1==i)&&(s=[0]),_&&($={level:0});for(var l=c,h=0;h<s.length;h++){for(var d=0;d<n;d++)g(o,r,d,a,i,s[h]);u.push(l.deflate(o,$))}var v,A=1e9;for(h=0;h<u.length;h++)u[h].length<A&&(v=h,A=u[h].length);return u[v]}function g(r,n,a,o,f,_){var $=a*o,u=$+a;if(r[u]=_,u++,0==_){if(o<500)for(var s=0;s<o;s++)r[u+s]=n[$+s];else r.set(new Uint8Array(n.buffer,$,o),u)}else if(1==_){for(s=0;s<f;s++)r[u+s]=n[$+s];for(s=f;s<o;s++)r[u+s]=n[$+s]-n[$+s-f]+256&255}else if(0==a){for(s=0;s<f;s++)r[u+s]=n[$+s];if(2==_)for(s=f;s<o;s++)r[u+s]=n[$+s];if(3==_)for(s=f;s<o;s++)r[u+s]=n[$+s]-(n[$+s-f]>>1)+256&255;if(4==_)for(s=f;s<o;s++)r[u+s]=n[$+s]-i(n[$+s-f],0,0)+256&255}else{if(2==_)for(s=0;s<o;s++)r[u+s]=n[$+s]+256-n[$+s-o]&255;if(3==_){for(s=0;s<f;s++)r[u+s]=n[$+s]+256-(n[$+s-o]>>1)&255;for(s=f;s<o;s++)r[u+s]=n[$+s]+256-(n[$+s-o]+n[$+s-f]>>1)&255}if(4==_){for(s=0;s<f;s++)r[u+s]=n[$+s]+256-i(0,n[$+s-o],0)&255;for(s=f;s<o;s++)r[u+s]=n[$+s]+256-i(n[$+s-f],n[$+s-o],n[$+s-f-o])&255}}}function p(r,n){var i,a=new Uint8Array(r),o=a.slice(0),f=new Uint32Array(o.buffer),_=w(o,n),$=_[0],u=_[1],s=a.length,l=new Uint8Array(s>>2);if(a.length<2e7)for(var c=0;c<s;c+=4)i=b($,h=a[c]*(1/255),d=a[c+1]*(1/255),v=a[c+2]*(1/255),A=a[c+3]*(1/255)),l[c>>2]=i.ind,f[c>>2]=i.est.rgba;else for(c=0;c<s;c+=4){var h=a[c]*(1/255),d=a[c+1]*(1/255),v=a[c+2]*(1/255),A=a[c+3]*(1/255);for(i=$;i.left;)i=0>=m(i.est,h,d,v,A)?i.left:i.right;l[c>>2]=i.ind,f[c>>2]=i.est.rgba}return{abuf:o.buffer,inds:l,plte:u}}function w(r,n,i){null==i&&(i=1e-4);var a=new Uint32Array(r.buffer),o={i0:0,i1:r.length,bst:null,est:null,tdst:0,left:null,right:null};o.bst=F(r,o.i0,o.i1),o.est=B(o.bst);for(var f=[o];f.length<n;){for(var _=0,$=0,u=0;u<f.length;u++)f[u].est.L>_&&(_=f[u].est.L,$=u);if(_<i)break;var s=f[$],l=y(r,a,s.i0,s.i1,s.est.e,s.est.eMq255);if(s.i0>=l||s.i1<=l){s.est.L=0;continue}var c={i0:s.i0,i1:l,bst:null,est:null,tdst:0,left:null,right:null};c.bst=F(r,c.i0,c.i1),c.est=B(c.bst);var h={i0:l,i1:s.i1,bst:null,est:null,tdst:0,left:null,right:null};for(u=0,h.bst={R:[],m:[],N:s.bst.N-c.bst.N};u<16;u++)h.bst.R[u]=s.bst.R[u]-c.bst.R[u];for(u=0;u<4;u++)h.bst.m[u]=s.bst.m[u]-c.bst.m[u];h.est=B(h.bst),s.left=c,s.right=h,f[$]=c,f.push(h)}for(f.sort(function(r,n){return n.bst.N-r.bst.N}),u=0;u<f.length;u++)f[u].ind=u;return[o,f]}function b(r,n,i,a,o){if(null==r.left){var f,_,$,u,s,l,c,h,d;return r.tdst=(f=r.est.q,_=n,$=i,u=a,s=o,l=_-f[0],c=$-f[1],h=u-f[2],l*l+c*c+h*h+(d=s-f[3])*d),r}var v=m(r.est,n,i,a,o),A=r.left,g=r.right;v>0&&(A=r.right,g=r.left);var p=b(A,n,i,a,o);if(p.tdst<=v*v)return p;var w=b(g,n,i,a,o);return w.tdst<p.tdst?w:p}function m(r,n,i,a,o){var f=r.e;return f[0]*n+f[1]*i+f[2]*a+f[3]*o-r.eMq}function y(r,n,i,a,o,f){for(a-=4;i<a;){for(;E(r,i,o)<=f;)i+=4;for(;E(r,a,o)>f;)a-=4;if(i>=a)break;var _=n[i>>2];n[i>>2]=n[a>>2],n[a>>2]=_,i+=4,a-=4}for(;E(r,i,o)>f;)i-=4;return i+4}function E(r,n,i){return r[n]*i[0]+r[n+1]*i[1]+r[n+2]*i[2]+r[n+3]*i[3]}function F(r,n,i){for(var a=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],o=[0,0,0,0],f=n;f<i;f+=4){var _=r[f]*(1/255),$=r[f+1]*(1/255),u=r[f+2]*(1/255),s=r[f+3]*(1/255);o[0]+=_,o[1]+=$,o[2]+=u,o[3]+=s,a[0]+=_*_,a[1]+=_*$,a[2]+=_*u,a[3]+=_*s,a[5]+=$*$,a[6]+=$*u,a[7]+=$*s,a[10]+=u*u,a[11]+=u*s,a[15]+=s*s}return a[4]=a[1],a[8]=a[2],a[9]=a[6],a[12]=a[3],a[13]=a[7],a[14]=a[11],{R:a,m:o,N:i-n>>2}}function B(r){var n=r.R,i=r.m,a=r.N,o=i[0],f=i[1],_=i[2],$=i[3],u=0==a?0:1/a,s=[n[0]-o*o*u,n[1]-o*f*u,n[2]-o*_*u,n[3]-o*$*u,n[4]-f*o*u,n[5]-f*f*u,n[6]-f*_*u,n[7]-f*$*u,n[8]-_*o*u,n[9]-_*f*u,n[10]-_*_*u,n[11]-_*$*u,n[12]-$*o*u,n[13]-$*f*u,n[14]-$*_*u,n[15]-$*$*u],l=s,c=Q,h=[Math.random(),Math.random(),Math.random(),Math.random()],d=0,v=0;if(0!=a)for(var A=0;A<16&&(h=c.multVec(l,h),v=Math.sqrt(c.dot(h,h)),h=c.sml(1/v,h),!(0!=A&&1e-9>Math.abs(v-d)));A++)d=v;var g=[o*u,f*u,_*u,$*u];return{Cov:s,q:g,e:h,L:d,eMq255:c.dot(c.sml(255,g),h),eMq:c.dot(h,g),rgba:(Math.round(255*g[3])<<24|Math.round(255*g[2])<<16|Math.round(255*g[1])<<8|Math.round(255*g[0])<<0)>>>0}}var Q={multVec:function r(n,i){return[n[0]*i[0]+n[1]*i[1]+n[2]*i[2]+n[3]*i[3],n[4]*i[0]+n[5]*i[1]+n[6]*i[2]+n[7]*i[3],n[8]*i[0]+n[9]*i[1]+n[10]*i[2]+n[11]*i[3],n[12]*i[0]+n[13]*i[1]+n[14]*i[2]+n[15]*i[3]]},dot:function r(n,i){return n[0]*i[0]+n[1]*i[1]+n[2]*i[2]+n[3]*i[3]},sml:function r(n,i){return[n*i[0],n*i[1],n*i[2],n*i[3]]}};h.encode=function r(n,i,a,o,f,_,$){null==o&&(o=0),null==$&&($=!1);var c=l(n,i,a,o,[!1,!1,!1,0,$,!1]);return s(c,-1),u(c,i,a,f,_)},h.encodeLL=function r(n,i,a,o,f,_,$,l){for(var c={ctype:0+(1==o?0:2)+(0==f?0:4),depth:_,frames:[]},h=(o+f)*_,d=h*i,v=0;v<n.length;v++)c.frames.push({rect:{x:0,y:0,width:i,height:a},img:new Uint8Array(n[v]),blend:0,dispose:1,bpp:Math.ceil(h/8),bpl:Math.ceil(d/8)});return s(c,0,!0),u(c,i,a,$,l)},h.encode.compress=l,h.encode.dither=$,h.quantize=p,h.quantize.getKDtree=w,h.quantize.getNearest=b}();var d={toArrayBuffer:function r(n,i){var a,o,f,_,$=n.width,u=n.height,s=$<<2,l=n.getContext("2d").getImageData(0,0,$,u),c=new Uint32Array(l.data.buffer),h=(32*$+31)/32<<2,v=h*u,A=122+v,g=new ArrayBuffer(A),p=new DataView(g),w=1048576,b=0,m=0,y=0;function E(r){p.setUint16(m,r,!0),m+=2}function F(r){p.setUint32(m,r,!0),m+=4}function B(r){m+=r}E(19778),F(A),m+=4,F(122),F(108),F($),F(-u>>>0),E(1),E(32),F(3),F(v),F(2835),F(2835),m+=8,F(16711680),F(65280),F(255),F(4278190080),F(1466527264),function r(){for(;b<u&&w>0;){for(_=122+b*h,a=0;a<s;)w--,f=(o=c[y++])>>>24,p.setUint32(_+a,o<<8|f),a+=4;b++}y<c.length?(w=1048576,setTimeout(r,d._dly)):i(g)}()},toBlob:function r(n,i){this.toArrayBuffer(n,function(r){i(new Blob([r],{type:"image/bmp"}))})},_dly:9},v={CHROME:"CHROME",FIREFOX:"FIREFOX",DESKTOP_SAFARI:"DESKTOP_SAFARI",IE:"IE",IOS:"IOS",ETC:"ETC"},A=(_defineProperty(n={},v.CHROME,16384),_defineProperty(n,v.FIREFOX,11180),_defineProperty(n,v.DESKTOP_SAFARI,16384),_defineProperty(n,v.IE,8192),_defineProperty(n,v.IOS,4096),_defineProperty(n,v.ETC,8192),n),g="undefined"!=typeof window,p="undefined"!=typeof WorkerGlobalScope&&self instanceof WorkerGlobalScope,w=g&&window.cordova&&window.cordova.require&&window.cordova.require("cordova/modulemapper"),b=((g||p)&&(w&&w.getOriginalSymbol(window,"File")||"undefined"!=typeof File&&File),(g||p)&&(w&&w.getOriginalSymbol(window,"FileReader")||"undefined"!=typeof FileReader&&FileReader));function m(r,n){var i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:Date.now();return new Promise(function(a){for(var o=r.split(","),f=o[0].match(/:(.*?);/)[1],_=globalThis.atob(o[1]),$=_.length,u=new Uint8Array($);$--;)u[$]=_.charCodeAt($);var s=new Blob([u],{type:f});s.name=n,s.lastModified=i,a(s)})}function y(r){return new Promise(function(n,i){var a=new b;a.onload=function(){return n(a.result)},a.onerror=function(r){return i(r)},a.readAsDataURL(r)})}function E(r){return new Promise(function(n,i){var a=new Image;a.onload=function(){return n(a)},a.onerror=function(r){return i(r)},a.src=r})}function F(){if(void 0!==F.cachedResult)return F.cachedResult;var r=v.ETC,n=navigator.userAgent;return/Chrom(e|ium)/i.test(n)?r=v.CHROME:/iP(ad|od|hone)/i.test(n)&&/WebKit/i.test(n)?r=v.IOS:/Safari/i.test(n)?r=v.DESKTOP_SAFARI:/Firefox/i.test(n)?r=v.FIREFOX:(/MSIE/i.test(n)||!0==!!document.documentMode)&&(r=v.IE),F.cachedResult=r,F.cachedResult}function B(r,n){for(var i=A[F()],a=r,o=n,f=a*o,_=a>o?o/a:a/o;f>i*i;){var $=(i+a)/2,u=(i+o)/2;$<u?(o=u,a=u*_):(o=$*_,a=$),f=a*o}return{width:a,height:o}}function Q(r,n){var i,a;try{if(a=(i=new OffscreenCanvas(r,n)).getContext("2d"),null===a)throw Error("getContext of OffscreenCanvas returns null")}catch(o){a=(i=document.createElement("canvas")).getContext("2d")}return i.width=r,i.height=n,[i,a]}function I(r,n){var i,a=B(r.width,r.height),o=Q(a.width,a.height),f=_slicedToArray(o,2),_=f[0],$=f[1];return n&&/jpe?g/.test(n)&&($.fillStyle="white",$.fillRect(0,0,_.width,_.height)),$.drawImage(r,0,0,_.width,_.height),_}function U(){return void 0!==U.cachedResult||(U.cachedResult=["iPad Simulator","iPhone Simulator","iPod Simulator","iPad","iPhone","iPod"].includes(navigator.platform)||navigator.userAgent.includes("Mac")&&"undefined"!=typeof document&&"ontouchend"in document),U.cachedResult}function C(r){var n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return new Promise(function(i,a){var o,f,_=function _(){try{return f=I(o,n.fileType||r.type),i([o,f])}catch($){return a($)}},$=function n(i){try{var f,$=function r(n){try{throw n}catch(i){return a(i)}};try{return y(r).then(function(r){try{return f=r,E(f).then(function(r){try{return o=r,function(){try{return _()}catch(r){return a(r)}}()}catch(n){return $(n)}},$)}catch(n){return $(n)}},$)}catch(u){$(u)}}catch(s){return a(s)}};try{if(U()||[v.DESKTOP_SAFARI,v.MOBILE_SAFARI].includes(F()))throw Error("Skip createImageBitmap on IOS and Safari");return createImageBitmap(r).then(function(r){try{return o=r,_()}catch(n){return $()}},$)}catch(u){$()}})}function T(r,n,i,a){var o=arguments.length>4&&void 0!==arguments[4]?arguments[4]:1;return new Promise(function(f,_){if("image/png"===n)return c=(s=(l=r.getContext("2d")).getImageData(0,0,r.width,r.height)).data,v=h.encode([c.buffer],r.width,r.height,4096*o),(u=new Blob([v],{type:n})).name=i,u.lastModified=a,p.call(this);var $=function r(){return p.call(this)};if("image/bmp"===n)return new Promise(function(n){return d.toBlob(r,n)}).then((function(r){try{return(u=r).name=i,u.lastModified=a,$.call(this)}catch(n){return _(n)}}).bind(this),_);var u,s,l,c,v,A,g=function r(){return $.call(this)};if("function"==typeof OffscreenCanvas&&r instanceof OffscreenCanvas)return r.convertToBlob({type:n,quality:o}).then((function(r){try{return(u=r).name=i,u.lastModified=a,g.call(this)}catch(n){return _(n)}}).bind(this),_);return m(A=r.toDataURL(n,o),i,a).then((function(r){try{return u=r,g.call(this)}catch(n){return _(n)}}).bind(this),_);function p(){return f(u)}})}function S(r){r.width=0,r.height=0}function x(){return new Promise(function(r,n){var i,a,o,f,_;return void 0!==x.cachedResult?r(x.cachedResult):(i="data:image/jpeg;base64,/9j/4QAiRXhpZgAATU0AKgAAAAgAAQESAAMAAAABAAYAAAAAAAD/2wCEAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/AABEIAAEAAgMBEQACEQEDEQH/xABKAAEAAAAAAAAAAAAAAAAAAAALEAEAAAAAAAAAAAAAAAAAAAAAAQEAAAAAAAAAAAAAAAAAAAAAEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8H//2Q==",m("data:image/jpeg;base64,/9j/4QAiRXhpZgAATU0AKgAAAAgAAQESAAMAAAABAAYAAAAAAAD/2wCEAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/AABEIAAEAAgMBEQACEQEDEQH/xABKAAEAAAAAAAAAAAAAAAAAAAALEAEAAAAAAAAAAAAAAAAAAAAAAQEAAAAAAAAAAAAAAAAAAAAAEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8H//2Q==","test.jpg",Date.now()).then(function(i){try{return a=i,C(a).then(function(i){try{return o=i[1],T(o,a.type,a.name,a.lastModified).then(function(i){try{return f=i,S(o),C(f).then(function(i){try{return _=i[0],x.cachedResult=1===_.width&&2===_.height,r(x.cachedResult)}catch(a){return n(a)}},n)}catch(a){return n(a)}},n)}catch($){return n($)}},n)}catch($){return n($)}},n))})}function R(r){return new Promise(function(n,i){var a=new b;a.onload=function(r){var i=new DataView(r.target.result);if(65496!=i.getUint16(0,!1))return n(-2);for(var a=i.byteLength,o=2;o<a&&!(8>=i.getUint16(o+2,!1));){var f=i.getUint16(o,!1);if(o+=2,65505==f){if(1165519206!=i.getUint32(o+=2,!1))return n(-1);var _=18761==i.getUint16(o+=6,!1);o+=i.getUint32(o+4,_);var $=i.getUint16(o,_);o+=2;for(var u=0;u<$;u++)if(274==i.getUint16(o+12*u,_))return n(i.getUint16(o+12*u+8,_))}else{if(65280!=(65280&f))break;o+=i.getUint16(o,!1)}}return n(-1)},a.onerror=function(r){return i(r)},a.readAsArrayBuffer(r)})}function P(r,n){var i,a,o,f=r.width,_=r.height,$=n.maxWidthOrHeight,u=r;return isFinite($)&&(f>$||_>$)&&(i=Q(f,_),u=(a=_slicedToArray(i,2))[0],o=a[1],f>_?(u.width=$,u.height=_/f*$):(u.width=f/_*$,u.height=$),o.drawImage(r,0,0,u.width,u.height),S(r)),u}function H(r,n){var i=r.width,a=r.height,o=Q(i,a),f=_slicedToArray(o,2),_=f[0],$=f[1];switch(n>4&&n<9?(_.width=a,_.height=i):(_.width=i,_.height=a),n){case 2:$.transform(-1,0,0,1,i,0);break;case 3:$.transform(-1,0,0,-1,i,a);break;case 4:$.transform(1,0,0,-1,0,a);break;case 5:$.transform(0,1,1,0,0,0);break;case 6:$.transform(0,1,-1,0,a,0);break;case 7:$.transform(0,-1,-1,0,a,i);break;case 8:$.transform(0,-1,1,0,0,i)}return $.drawImage(r,0,0,i,a),S(r),_}function L(r,n){var i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:0;return new Promise(function(a,o){var f,_,$,u,s,l,c,h,d,v,A,g,p,w,b,m,y,E,F,B;function I(){var r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:5;if(n.signal&&n.signal.aborted)throw n.signal.reason;f+=r,n.onProgress(Math.min(f,100))}function U(r){if(n.signal&&n.signal.aborted)throw n.signal.reason;f=Math.min(Math.max(r,f),100),n.onProgress(f)}return f=i,_=n.maxIteration||10,$=1024*n.maxSizeMB*1024,I(),C(r,n).then((function(i){try{var f;return u=(f=_slicedToArray(i,2))[1],I(),s=P(u,n),I(),new Promise(function(i,a){var o;if(!(o=n.exifOrientation))return R(r).then((function(r){try{return o=r,f.call(this)}catch(n){return a(n)}}).bind(this),a);function f(){return i(o)}return f.call(this)}).then((function(i){try{return l=i,I(),x().then((function(i){try{return c=i?s:H(s,l),I(),h=n.initialQuality||1,d=n.fileType||r.type,T(c,d,r.name,r.lastModified,h).then((function(i){try{var f,l=function n(){if(_--&&(b>$||b>p)){var i,a,f,u;return f=B?.95*F.width:F.width,u=B?.95*F.height:F.height,i=Q(f,u),y=(a=_slicedToArray(i,2))[0],(E=a[1]).drawImage(F,0,0,f,u),h*="image/png"===d?.85:.95,T(y,d,r.name,r.lastModified,h).then(function(r){try{return m=r,S(F),F=y,b=m.size,U(Math.min(99,Math.floor((w-b)/(w-$)*100))),n}catch(i){return o(i)}},o)}return[1]},C=function r(){return S(F),S(y),S(s),S(c),S(u),U(100),a(m)};if(v=i,I(),A=v.size>$,g=v.size>r.size,!A&&!g)return U(100),a(v);return p=r.size,b=w=v.size,F=c,B=!n.alwaysKeepResolution&&A,(f=(function(r){for(;r;){if(r.then)return void r.then(f,o);try{if(r.pop){if(r.length)return r.pop()?C.call(this):r;r=l}else r=r.call(this)}catch(n){return o(n)}}}).bind(this))(l)}catch(x){return o(x)}}).bind(this),o)}catch(f){return o(f)}}).bind(this),o)}catch(f){return o(f)}}).bind(this),o)}catch(C){return o(C)}}).bind(this),o)})}function O(n,a){return new Promise(function(o,f){if(s=_objectSpread({},a),c=0,h=(u=s).onProgress,s.maxSizeMB=s.maxSizeMB||Number.POSITIVE_INFINITY,d="boolean"!=typeof s.useWebWorker||s.useWebWorker,delete s.useWebWorker,s.onProgress=function(r){c=r,"function"==typeof h&&h(c)},!/^image/.test(n.type))return f(Error("The file given is not an image"));if(v="undefined"!=typeof WorkerGlobalScope&&self instanceof WorkerGlobalScope,!d||"function"!=typeof Worker||v)return L(n,s).then((function(r){try{return l=r,w.call(this)}catch(n){return f(n)}}).bind(this),f);var _,$,u,s,l,c,h,d,v,A=(function(){try{return w.call(this)}catch(r){return f(r)}}).bind(this),g=function r(i){try{return L(n,s).then(function(r){try{return l=r,A()}catch(n){return f(n)}},f)}catch(a){return f(a)}};try{return s.libURL=s.libURL||"https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js",(_=n,$=s,new Promise(function(r,n){var a,o="\nlet scriptImported = false\nself.addEventListener('message', async (e) => {\n  const { file, id, imageCompressionLibUrl, options } = e.data\n  options.onProgress = (progress) => self.postMessage({ progress, id })\n  try {\n    if (!scriptImported) {\n      // console.log('[worker] importScripts', imageCompressionLibUrl)\n      self.importScripts(imageCompressionLibUrl)\n      scriptImported = true\n    }\n    // console.log('[worker] self', self)\n    const compressedFile = await imageCompression(file, options)\n    self.postMessage({ file: compressedFile, id })\n  } catch (e) {\n    // console.error('[worker] error', e)\n    self.postMessage({ error: e.message + '\\n' + e.stack, id })\n  }\n})\n";i||(i=(a=[],"function"==typeof o?a.push("(".concat(o,")()")):a.push(o),URL.createObjectURL(new Blob(a))));var f=new Worker(i);f.addEventListener("message",function i(a){if($.signal&&$.signal.aborted)f.terminate();else if(void 0===a.data.progress){if(a.data.error)return n(Error(a.data.error)),void f.terminate();r(a.data.file),f.terminate()}else $.onProgress(a.data.progress)}),f.addEventListener("error",n),$.signal&&$.signal.addEventListener("abort",function(){n($.signal.reason),f.terminate()}),f.postMessage({file:_,imageCompressionLibUrl:$.libURL,options:_objectSpread(_objectSpread({},$),{},{onProgress:void 0,signal:void 0})})})).then(function(r){try{return l=r,A()}catch(n){return g()}},g)}catch(p){g()}function w(){try{l.name=n.name,l.lastModified=n.lastModified}catch(i){}try{s.preserveExif&&"image/jpeg"===n.type&&(!s.fileType||s.fileType&&s.fileType===n.type)&&(l=r(n,l))}catch(a){}return o(l)}})}return O.getDataUrlFromFile=y,O.getFilefromDataUrl=m,O.loadImage=E,O.drawImageInCanvas=I,O.drawFileInCanvas=C,O.canvasToFile=T,O.getExifOrientation=R,O.handleMaxWidthOrHeight=P,O.followExifOrientation=H,O.cleanupCanvasMemory=S,O.isAutoOrientationInBrowser=x,O.approximateBelowMaximumCanvasSizeOfBrowser=B,O.copyExifWithoutOrientation=r,O.getBrowserName=F,O.version="2.0.2",O})();
        })();
    
        var $ = Base.$,
            throttle;
    
        // 根据要处理的文件大小来节流，一次不能处理太多，会卡。
        throttle = (function( max ) {
            var occupied = 0,
                waiting = [],
                tick = function() {
                    var item;
    
                    while ( waiting.length && occupied < max ) {
                        item = waiting.shift();
                        occupied += item[ 0 ];
                        item[ 1 ]();
                    }
                };
    
            return function( emiter, size, cb ) {
                waiting.push([ size, cb ]);
                emiter.once( 'destroy', function() {
                    occupied -= size;
                    setTimeout( tick, 1 );
                });
                setTimeout( tick, 1 );
            };
        })( 5 * 1024 * 1024 );
    
        $.extend( Uploader.options, {
    
            /**
             * @property {Object} [thumb]
             * @namespace options
             * @for Uploader
             * @description 配置生成缩略图的选项。
             *
             * 默认为：
             *
             * ```javascript
             * {
             *     width: 110,
             *     height: 110,
             *
             *     // 图片质量，只有type为`image/jpeg`的时候才有效。
             *     quality: 70,
             *
             *     // 是否允许放大，如果想要生成小图的时候不失真，此选项应该设置为false.
             *     allowMagnify: true,
             *
             *     // 是否允许裁剪。
             *     crop: true,
             *
             *     // 为空的话则保留原有图片格式。
             *     // 否则强制转换成指定的类型。
             *     type: 'image/jpeg'
             * }
             * ```
             */
            thumb: {
                width: 110,
                height: 110,
                quality: 70,
                allowMagnify: true,
                crop: true,
                preserveHeaders: false,
    
                // 为空的话则保留原有图片格式。
                // 否则强制转换成指定的类型。
                // IE 8下面 base64 大小不能超过 32K 否则预览失败，而非 jpeg 编码的图片很可
                // 能会超过 32k, 所以这里设置成预览的时候都是 image/jpeg
                type: 'image/jpeg'
            },
            compress: {
                // 是否开启
                enable: false,
                // 压缩最大宽度或高度
                maxWidthOrHeight: 2000,
                // 压缩的最大大小
                maxSize: 10*1024*1024,
            }
        });
    
        return Uploader.register({
    
            name: 'image',
    
    
            /**
             * 生成缩略图，此过程为异步，所以需要传入`callback`。
             * 通常情况在图片加入队里后调用此方法来生成预览图以增强交互效果。
             *
             * 当 width 或者 height 的值介于 0 - 1 时，被当成百分比使用。
             *
             * `callback`中可以接收到两个参数。
             * * 第一个为error，如果生成缩略图有错误，此error将为真。
             * * 第二个为ret, 缩略图的Data URL值。
             *
             * **注意**
             * Date URL在IE6/7中不支持，所以不用调用此方法了，直接显示一张暂不支持预览图片好了。
             * 也可以借助服务端，将 base64 数据传给服务端，生成一个临时文件供预览。
             *
             * @method makeThumb
             * @grammar makeThumb( file, callback ) => undefined
             * @grammar makeThumb( file, callback, width, height ) => undefined
             * @for Uploader
             * @example
             *
             * uploader.on( 'fileQueued', function( file ) {
             *     var $li = ...;
             *
             *     uploader.makeThumb( file, function( error, ret ) {
             *         if ( error ) {
             *             $li.text('预览错误');
             *         } else {
             *             $li.append('<img alt="" src="' + ret + '" />');
             *         }
             *     });
             *
             * });
             */
            makeThumb: function( file, cb, width, height ) {
                var opts, image;
    
                file = this.request( 'get-file', file );
    
                // 只预览图片格式。
                if ( !file.type.match( /^image/ ) ) {
                    cb( true );
                    return;
                }
    
                opts = $.extend({}, this.options.thumb );
    
                // 如果传入的是object.
                if ( $.isPlainObject( width ) ) {
                    opts = $.extend( opts, width );
                    width = null;
                }
    
                width = width || opts.width;
                height = height || opts.height;
    
                image = new Image( opts );
    
                image.once( 'load', function() {
                    file._info = file._info || image.info();
                    file._meta = file._meta || image.meta();
    
                    // 如果 width 的值介于 0 - 1
                    // 说明设置的是百分比。
                    if ( width <= 1 && width > 0 ) {
                        width = file._info.width * width;
                    }
    
                    // 同样的规则应用于 height
                    if ( height <= 1 && height > 0 ) {
                        height = file._info.height * height;
                    }
    
                    image.resize( width, height );
                });
    
                // 当 resize 完后
                image.once( 'complete', function() {
                    cb( false, image.getAsDataUrl( opts.type ) );
                    image.destroy();
                });
    
                image.once( 'error', function( reason ) {
                    cb( reason || true );
                    image.destroy();
                });
    
                throttle( image, file.source.size, function() {
                    file._info && image.info( file._info );
                    file._meta && image.meta( file._meta );
                    image.loadFromBlob( file.source );
                });
            },
    
            beforeSendFile: function( file ) {
                var opts = this.options.compress, image, deferred;
    
                // console.log('image.beforeSendFile',opts, file)
    
                file = this.request( 'get-file', file );
    
                if ( !opts || !opts.enable || !~'image/jpeg,image/jpg,image/png'.indexOf( file.type ) || file._compressed ) {
                    return;
                }
    
                opts = $.extend({}, opts );
                deferred = Base.Deferred();
    
                imageCompression(file.source.source,{
                    maxSizeMB: opts.maxSize/1024/1024,
                    maxWidthOrHeight: opts.maxWidthOrHeight,
                }).then(function (compressedBlob) {
                    if(opts.debug){
                        console.log('webuploader.compress', (compressedBlob.size / file.size * 100).toFixed(2) + '%');
                    }
                    var oldSize = file.size;
                    file.source.source = compressedBlob;
                    file.source.size = compressedBlob.size;
                    file.size = compressedBlob.size;
                    file.trigger( 'resize', compressedBlob.size, oldSize );
                    file._compressed = true;
                    deferred.resolve();
                }).catch(function (error) {
                    console.error('webuploader.compress.error',error)
                    deferred.resolve();
                });
    
                // image = new Image( opts );
                //
                // deferred.always(function() {
                //     image.destroy();
                //     image = null;
                // });
                // image.once( 'error', deferred.reject );
                // image.once( 'load', function() {
                //     var width = opts.width,
                //         height = opts.height;
                //
                //     file._info = file._info || image.info();
                //     file._meta = file._meta || image.meta();
                //
                //     // 如果 width 的值介于 0 - 1
                //     // 说明设置的是百分比。
                //     if ( width <= 1 && width > 0 ) {
                //         width = file._info.width * width;
                //     }
                //
                //     // 同样的规则应用于 height
                //     if ( height <= 1 && height > 0 ) {
                //         height = file._info.height * height;
                //     }
                //
                //     image.resize( width, height );
                // });
                //
                // image.once( 'complete', function() {
                //     var blob, size;
                //
                //     // 移动端 UC / qq 浏览器的无图模式下
                //     // ctx.getImageData 处理大图的时候会报 Exception
                //     // INDEX_SIZE_ERR: DOM Exception 1
                //     try {
                //         blob = image.getAsBlob( opts.type );
                //
                //         size = file.size;
                //
                //         // 如果压缩后，比原来还大则不用压缩后的。
                //         if ( !noCompressIfLarger || blob.size < size ) {
                //             // file.source.destroy && file.source.destroy();
                //             file.source = blob;
                //             file.size = blob.size;
                //
                //             file.trigger( 'resize', blob.size, size );
                //         }
                //
                //         // 标记，避免重复压缩。
                //         file._compressed = true;
                //         deferred.resolve();
                //     } catch ( e ) {
                //         // 出错了直接继续，让其上传原始图片
                //         deferred.resolve();
                //     }
                // });
                //
                // file._info && image.info( file._info );
                // file._meta && image.meta( file._meta );
                //
                // image.loadFromBlob( file.source );
                return deferred.promise();
            }
        });
    });
    
    /**
     * @fileOverview 文件属性封装
     */
    define('file',[
        'base',
        'mediator'
    ], function( Base, Mediator ) {
    
        var $ = Base.$,
            idPrefix = 'WU_FILE_',
            idSuffix = 0,
            rExt = /\.([^.]+)$/,
            statusMap = {};
    
        function gid() {
            return idPrefix + idSuffix++;
        }
    
        /**
         * 文件类
         * @class File
         * @constructor 构造函数
         * @grammar new File( source ) => File
         * @param {Lib.File} source [lib.File](#Lib.File)实例, 此source对象是带有Runtime信息的。
         */
        function WUFile( source ) {
    
            /**
             * 文件名，包括扩展名（后缀）
             * @property name
             * @type {string}
             */
            this.name = source.name || 'Untitled';
    
            /**
             * 文件体积（字节）
             * @property size
             * @type {uint}
             * @default 0
             */
            this.size = source.size || 0;
    
            /**
             * 文件MIMETYPE类型，与文件类型的对应关系请参考[http://t.cn/z8ZnFny](http://t.cn/z8ZnFny)
             * @property type
             * @type {string}
             * @default 'application/octet-stream'
             */
            this.type = source.type || 'application/octet-stream';
    
            /**
             * 文件最后修改日期
             * @property lastModifiedDate
             * @type {int}
             * @default 当前时间戳
             */
            this.lastModifiedDate = source.lastModifiedDate || (new Date() * 1);
    
            /**
             * 文件ID，每个对象具有唯一ID，与文件名无关
             * @property id
             * @type {string}
             */
            this.id = gid();
    
            /**
             * 文件扩展名，通过文件名获取，例如test.png的扩展名为png
             * @property ext
             * @type {string}
             */
            this.ext = rExt.exec( this.name ) ? RegExp.$1 : '';
    
    
            /**
             * 状态文字说明。在不同的status语境下有不同的用途。
             * @property statusText
             * @type {string}
             */
            this.statusText = '';
    
            // 存储文件状态，防止通过属性直接修改
            statusMap[ this.id ] = WUFile.Status.INITED;
    
            this.source = source;
            this.loaded = 0;
    
            this.on( 'error', function( msg ) {
                this.setStatus( WUFile.Status.ERROR, msg );
            });
        }
    
        $.extend( WUFile.prototype, {
    
            /**
             * 设置状态，状态变化时会触发`change`事件。
             * @method setStatus
             * @grammar setStatus( status[, statusText] );
             * @param {File.Status|String} status [文件状态值](#WebUploader:File:File.Status)
             * @param {String} [statusText=''] 状态说明，常在error时使用，用http, abort,server等来标记是由于什么原因导致文件错误。
             */
            setStatus: function( status, text ) {
    
                var prevStatus = statusMap[ this.id ];
    
                typeof text !== 'undefined' && (this.statusText = text);
    
                if ( status !== prevStatus ) {
                    statusMap[ this.id ] = status;
                    /**
                     * 文件状态变化
                     * @event statuschange
                     */
                    this.trigger( 'statuschange', status, prevStatus );
                }
    
            },
    
            /**
             * 获取文件状态
             * @return {File.Status}
             * @example
                     文件状态具体包括以下几种类型：
                     {
                         // 初始化
                        INITED:     0,
                        // 已入队列
                        QUEUED:     1,
                        // 正在上传
                        PROGRESS:     2,
                        // 上传出错
                        ERROR:         3,
                        // 上传成功
                        COMPLETE:     4,
                        // 上传取消
                        CANCELLED:     5
                    }
             */
            getStatus: function() {
                return statusMap[ this.id ];
            },
    
            /**
             * 获取文件原始信息。
             * @return {*}
             */
            getSource: function() {
                return this.source;
            },
    
            destroy: function() {
                this.off();
                delete statusMap[ this.id ];
            }
        });
    
        Mediator.installTo( WUFile.prototype );
    
        /**
         * 文件状态值，具体包括以下几种类型：
         * * `inited` 初始状态
         * * `queued` 已经进入队列, 等待上传
         * * `progress` 上传中
         * * `complete` 上传完成。
         * * `error` 上传出错，可重试
         * * `interrupt` 上传中断，可续传。
         * * `invalid` 文件不合格，不能重试上传。会自动从队列中移除。
         * * `cancelled` 文件被移除。
         * @property {Object} Status
         * @namespace File
         * @class File
         * @static
         */
        WUFile.Status = {
            INITED:     'inited',    // 初始状态
            QUEUED:     'queued',    // 已经进入队列, 等待上传
            PROGRESS:   'progress',    // 上传中
            ERROR:      'error',    // 上传出错，可重试
            COMPLETE:   'complete',    // 上传完成。
            CANCELLED:  'cancelled',    // 上传取消。
            INTERRUPT:  'interrupt',    // 上传中断，可续传。
            INVALID:    'invalid'    // 文件不合格，不能重试上传。
        };
    
        return WUFile;
    });
    
    /**
     * @fileOverview 文件队列
     */
    define('queue',[
        'base',
        'mediator',
        'file'
    ], function( Base, Mediator, WUFile ) {
    
        var $ = Base.$,
            STATUS = WUFile.Status;
    
        /**
         * 文件队列, 用来存储各个状态中的文件。
         * @class Queue
         * @extends Mediator
         */
        function Queue() {
    
            /**
             * 统计文件数。
             * * `numOfQueue` 队列中的文件数。
             * * `numOfSuccess` 上传成功的文件数
             * * `numOfCancel` 被取消的文件数
             * * `numOfProgress` 正在上传中的文件数
             * * `numOfUploadFailed` 上传错误的文件数。
             * * `numOfInvalid` 无效的文件数。
             * * `numOfDeleted` 被移除的文件数。
             * * `numOfInterrupt` 被中断的文件数。
             * @property {Object} stats
             */
            this.stats = {
                numOfQueue: 0,
                numOfSuccess: 0,
                numOfCancel: 0,
                numOfProgress: 0,
                numOfUploadFailed: 0,
                numOfInvalid: 0,
                numOfDeleted: 0,
                numOfInterrupt: 0
            };
    
            // 上传队列，仅包括等待上传的文件
            this._queue = [];
    
            // 存储所有文件
            this._map = {};
        }
    
        $.extend( Queue.prototype, {
    
            /**
             * 将新文件加入对队列尾部
             *
             * @method append
             * @param  {File} file   文件对象
             */
            append: function( file ) {
                this._queue.push( file );
                this._fileAdded( file );
                return this;
            },
    
            /**
             * 将新文件加入对队列头部
             *
             * @method prepend
             * @param  {File} file   文件对象
             */
            prepend: function( file ) {
                this._queue.unshift( file );
                this._fileAdded( file );
                return this;
            },
    
            /**
             * 获取文件对象
             *
             * @method getFile
             * @param  {String} fileId   文件ID
             * @return {File}
             */
            getFile: function( fileId ) {
                if ( typeof fileId !== 'string' ) {
                    return fileId;
                }
                return this._map[ fileId ];
            },
    
            /**
             * 从队列中取出一个指定状态的文件。
             * @grammar fetch( status ) => File
             * @method fetch
             * @param {String} status [文件状态值](#WebUploader:File:File.Status)
             * @return {File} [File](#WebUploader:File)
             */
            fetch: function( status ) {
                var len = this._queue.length,
                    i, file;
    
                status = status || STATUS.QUEUED;
    
                for ( i = 0; i < len; i++ ) {
                    file = this._queue[ i ];
    
                    if ( status === file.getStatus() ) {
                        return file;
                    }
                }
    
                return null;
            },
    
            /**
             * 对队列进行排序，能够控制文件上传顺序。
             * @grammar sort( fn ) => undefined
             * @method sort
             * @param {Function} fn 排序方法
             */
            sort: function( fn ) {
                if ( typeof fn === 'function' ) {
                    this._queue.sort( fn );
                }
            },
    
            /**
             * 获取指定类型的文件列表, 列表中每一个成员为[File](#WebUploader:File)对象。
             * @grammar getFiles( [status1[, status2 ...]] ) => Array
             * @method getFiles
             * @param {String} [status] [文件状态值](#WebUploader:File:File.Status)
             */
            getFiles: function() {
                var sts = [].slice.call( arguments, 0 ),
                    ret = [],
                    i = 0,
                    len = this._queue.length,
                    file;
    
                for ( ; i < len; i++ ) {
                    file = this._queue[ i ];
    
                    if ( sts.length && !~$.inArray( file.getStatus(), sts ) ) {
                        continue;
                    }
    
                    ret.push( file );
                }
    
                return ret;
            },
    
            /**
             * 在队列中删除文件。
             * @grammar removeFile( file ) => Array
             * @method removeFile
             * @param {File} 文件对象。
             */
            removeFile: function( file ) {
                var me = this,
                    existing = this._map[ file.id ];
    
                if ( existing ) {
                    delete this._map[ file.id ];
                    this._delFile(file);
                    file.destroy();
                    this.stats.numOfDeleted++;
    
                }
            },
    
            _fileAdded: function( file ) {
                var me = this,
                    existing = this._map[ file.id ];
    
                if ( !existing ) {
                    this._map[ file.id ] = file;
    
                    file.on( 'statuschange', function( cur, pre ) {
                        me._onFileStatusChange( cur, pre );
                    });
                }
    
                file.setStatus( STATUS.QUEUED );
            },
    
            _delFile : function(file){
                for(var i = this._queue.length - 1 ; i >= 0 ; i-- ){
                    if(this._queue[i] == file){
                        this._queue.splice(i,1);
                        break;
                    }
                }
            },
    
            _onFileStatusChange: function( curStatus, preStatus ) {
                var stats = this.stats;
    
                switch ( preStatus ) {
                    case STATUS.PROGRESS:
                        stats.numOfProgress--;
                        break;
    
                    case STATUS.QUEUED:
                        stats.numOfQueue --;
                        break;
    
                    case STATUS.ERROR:
                        stats.numOfUploadFailed--;
                        break;
    
                    case STATUS.INVALID:
                        stats.numOfInvalid--;
                        break;
    
                    case STATUS.INTERRUPT:
                        stats.numOfInterrupt--;
                        break;
                }
    
                switch ( curStatus ) {
                    case STATUS.QUEUED:
                        stats.numOfQueue++;
                        break;
    
                    case STATUS.PROGRESS:
                        stats.numOfProgress++;
                        break;
    
                    case STATUS.ERROR:
                        stats.numOfUploadFailed++;
                        break;
    
                    case STATUS.COMPLETE:
                        stats.numOfSuccess++;
                        break;
    
                    case STATUS.CANCELLED:
                        stats.numOfCancel++;
                        break;
    
    
                    case STATUS.INVALID:
                        stats.numOfInvalid++;
                        break;
    
                    case STATUS.INTERRUPT:
                        stats.numOfInterrupt++;
                        break;
                }
            }
    
        });
    
        Mediator.installTo( Queue.prototype );
    
        return Queue;
    });
    
    /**
     * @fileOverview 队列
     */
    define('widgets/queue',[
        'base',
        'uploader',
        'queue',
        'file',
        'lib/file',
        'runtime/client',
        'widgets/widget'
    ], function( Base, Uploader, Queue, WUFile, File, RuntimeClient ) {
    
        var $ = Base.$,
            rExt = /\.\w+$/,
            Status = WUFile.Status;
    
        return Uploader.register({
            name: 'queue',
    
            init: function( opts ) {
                var me = this,
                    deferred, len, i, item, arr, accept, runtime;
    
                if ( $.isPlainObject( opts.accept ) ) {
                    opts.accept = [ opts.accept ];
                }
    
                // accept中的中生成匹配正则。
                if ( opts.accept ) {
                    arr = [];
    
                    for ( i = 0, len = opts.accept.length; i < len; i++ ) {
                        item = opts.accept[ i ].extensions;
                        item && arr.push( item );
                    }
    
                    if ( arr.length ) {
                        accept = '\\.' + arr.join(',')
                                .replace( /,/g, '$|\\.' )
                                .replace( /\*/g, '.*' ) + '$';
                    }
    
                    me.accept = new RegExp( accept, 'i' );
                }
    
                me.queue = new Queue();
                me.stats = me.queue.stats;
    
                // 如果当前不是html5运行时，那就算了。
                // 不执行后续操作
                if ( this.request('predict-runtime-type') !== 'html5' ) {
                    return;
                }
    
                // 创建一个 html5 运行时的 placeholder
                // 以至于外部添加原生 File 对象的时候能正确包裹一下供 webuploader 使用。
                deferred = Base.Deferred();
                this.placeholder = runtime = new RuntimeClient('Placeholder');
                runtime.connectRuntime({
                    runtimeOrder: 'html5'
                }, function() {
                    me._ruid = runtime.getRuid();
                    deferred.resolve();
                });
                return deferred.promise();
            },
    
    
            // 为了支持外部直接添加一个原生File对象。
            _wrapFile: function( file ) {
                if ( !(file instanceof WUFile) ) {
    
                    if ( !(file instanceof File) ) {
                        if ( !this._ruid ) {
                            throw new Error('Can\'t add external files.');
                        }
                        file = new File( this._ruid, file );
                    }
    
                    file = new WUFile( file );
                }
    
                return file;
            },
    
            // 判断文件是否可以被加入队列
            acceptFile: function( file ) {
                var invalid = !file || !file.size || this.accept &&
    
                        // 如果名字中有后缀，才做后缀白名单处理。
                        rExt.exec( file.name ) && !this.accept.test( file.name );
    
                return !invalid;
            },
    
    
            /**
             * @event beforeFileQueued
             * @param {File} file File对象
             * @description 当文件被加入队列之前触发。如果此事件handler的返回值为`false`，则此文件不会被添加进入队列。
             * @for  Uploader
             */
    
            /**
             * @event fileQueued
             * @param {File} file File对象
             * @description 当文件被加入队列以后触发。
             * @for  Uploader
             */
    
            _addFile: function( file ) {
                var me = this;
    
                file = me._wrapFile( file );
    
                // 不过类型判断允许不允许，先派送 `beforeFileQueued`
                if ( !me.owner.trigger( 'beforeFileQueued', file ) ) {
                    return;
                }
    
                // 类型不匹配，则派送错误事件，并返回。
                if ( !me.acceptFile( file ) ) {
                    me.owner.trigger( 'error', 'Q_TYPE_DENIED', file );
                    return;
                }
    
                me.queue.append( file );
                me.owner.trigger( 'fileQueued', file );
                return file;
            },
    
            getFile: function( fileId ) {
                return this.queue.getFile( fileId );
            },
    
            /**
             * @event filesQueued
             * @param {File} files 数组，内容为原始File(lib/File）对象。
             * @description 当一批文件添加进队列以后触发。
             * @for  Uploader
             */
            
            /**
             * @property {Boolean} [auto=false]
             * @namespace options
             * @for Uploader
             * @description 设置为 true 后，不需要手动调用上传，有文件选择即开始上传。
             * 
             */
    
            /**
             * @method addFiles
             * @grammar addFiles( file ) => undefined
             * @grammar addFiles( [file1, file2 ...] ) => undefined
             * @param {Array of File or File} [files] Files 对象 数组
             * @description 添加文件到队列
             * @for  Uploader
             */
            addFile: function( files ) {
                var me = this;
    
                if ( !files.length ) {
                    files = [ files ];
                }
    
                files = $.map( files, function( file ) {
                    return me._addFile( file );
                });
    			
    			if ( files.length ) {
    
                    me.owner.trigger( 'filesQueued', files );
    
    				if ( me.options.auto ) {
    					setTimeout(function() {
    						me.request('start-upload');
    					}, 20 );
    				}
                }
            },
    
            getStats: function() {
                return this.stats;
            },
    
            /**
             * @event fileDequeued
             * @param {File} file File对象
             * @description 当文件被移除队列后触发。
             * @for  Uploader
             */
    
             /**
             * @method removeFile
             * @grammar removeFile( file ) => undefined
             * @grammar removeFile( id ) => undefined
             * @grammar removeFile( file, true ) => undefined
             * @grammar removeFile( id, true ) => undefined
             * @param {File|id} file File对象或这File对象的id
             * @description 移除某一文件, 默认只会标记文件状态为已取消，如果第二个参数为 `true` 则会从 queue 中移除。
             * @for  Uploader
             * @example
             *
             * $li.on('click', '.remove-this', function() {
             *     uploader.removeFile( file );
             * })
             */
            removeFile: function( file, remove ) {
                var me = this;
    
                file = file.id ? file : me.queue.getFile( file );
    
                this.request( 'cancel-file', file );
    
                if ( remove ) {
                    this.queue.removeFile( file );
                }
            },
    
            /**
             * @method getFiles
             * @grammar getFiles() => Array
             * @grammar getFiles( status1, status2, status... ) => Array
             * @description 返回指定状态的文件集合，不传参数将返回所有状态的文件。
             * @for  Uploader
             * @example
             * console.log( uploader.getFiles() );    // => all files
             * console.log( uploader.getFiles('error') )    // => all error files.
             */
            getFiles: function() {
                return this.queue.getFiles.apply( this.queue, arguments );
            },
    
            fetchFile: function() {
                return this.queue.fetch.apply( this.queue, arguments );
            },
    
            /**
             * @method retry
             * @grammar retry() => undefined
             * @grammar retry( file ) => undefined
             * @description 重试上传，重试指定文件，或者从出错的文件开始重新上传。
             * @for  Uploader
             * @example
             * function retry() {
             *     uploader.retry();
             * }
             */
            retry: function( file, noForceStart ) {
                var me = this,
                    files, i, len;
    
                if ( file ) {
                    file = file.id ? file : me.queue.getFile( file );
                    file.setStatus( Status.QUEUED );
                    noForceStart || me.request('start-upload');
                    return;
                }
    
                files = me.queue.getFiles( Status.ERROR );
                i = 0;
                len = files.length;
    
                for ( ; i < len; i++ ) {
                    file = files[ i ];
                    file.setStatus( Status.QUEUED );
                }
    
                me.request('start-upload');
            },
    
            /**
             * @method sort
             * @grammar sort( fn ) => undefined
             * @description 排序队列中的文件，在上传之前调整可以控制上传顺序。
             * @for  Uploader
             */
            sortFiles: function() {
                return this.queue.sort.apply( this.queue, arguments );
            },
    
            /**
             * @event reset
             * @description 当 uploader 被重置的时候触发。
             * @for  Uploader
             */
    
            /**
             * @method reset
             * @grammar reset() => undefined
             * @description 重置uploader。目前只重置了队列。
             * @for  Uploader
             * @example
             * uploader.reset();
             */
            reset: function() {
                this.owner.trigger('reset');
                this.queue = new Queue();
                this.stats = this.queue.stats;
            },
    
            destroy: function() {
                this.reset();
                this.placeholder && this.placeholder.destroy();
            }
        });
    
    });
    /**
     * @fileOverview 添加获取Runtime相关信息的方法。
     */
    define('widgets/runtime',[
        'uploader',
        'runtime/runtime',
        'widgets/widget'
    ], function( Uploader, Runtime ) {
    
        Uploader.support = function() {
            return Runtime.hasRuntime.apply( Runtime, arguments );
        };
    
        /**
         * @property {Object} [runtimeOrder=html5,flash]
         * @namespace options
         * @for Uploader
         * @description 指定运行时启动顺序。默认会先尝试 html5 是否支持，如果支持则使用 html5, 否则使用 flash.
         *
         * 可以将此值设置成 `flash`，来强制使用 flash 运行时。
         */
    
        return Uploader.register({
            name: 'runtime',
    
            init: function() {
                if ( !this.predictRuntimeType() ) {
                    throw Error('Runtime Error');
                }
            },
    
            /**
             * 预测Uploader将采用哪个`Runtime`
             * @grammar predictRuntimeType() => String
             * @method predictRuntimeType
             * @for  Uploader
             */
            predictRuntimeType: function() {
                var orders = this.options.runtimeOrder || Runtime.orders,
                    type = this.type,
                    i, len;
    
                if ( !type ) {
                    orders = orders.split( /\s*,\s*/g );
    
                    for ( i = 0, len = orders.length; i < len; i++ ) {
                        if ( Runtime.hasRuntime( orders[ i ] ) ) {
                            this.type = type = orders[ i ];
                            break;
                        }
                    }
                }
    
                return type;
            }
        });
    });
    /**
     * @fileOverview Transport
     */
    define('lib/transport',[
        'base',
        'runtime/client',
        'mediator'
    ], function( Base, RuntimeClient, Mediator ) {
    
        var $ = Base.$;
    
        function Transport( opts ) {
            var me = this;
    
            opts = me.options = $.extend( true, {}, Transport.options, opts || {} );
            RuntimeClient.call( this, 'Transport' );
    
            this._blob = null;
            this._formData = opts.formData || {};
            this._headers = opts.headers || {};
    
            this.on( 'progress', this._timeout );
            this.on( 'load error', function() {
                me.trigger( 'progress', 1 );
                clearTimeout( me._timer );
            });
        }
    
        Transport.options = {
            server: '',
            method: 'POST',
    
            // 跨域时，是否允许携带cookie, 只有html5 runtime才有效
            withCredentials: false,
            fileVal: 'file',
            timeout: 2 * 60 * 1000,    // 2分钟
            formData: {},
            headers: {},
            sendAsBinary: false
        };
    
        $.extend( Transport.prototype, {
    
            // 添加Blob, 只能添加一次，最后一次有效。
            appendBlob: function( key, blob, filename ) {
                var me = this,
                    opts = me.options;
    
                if ( me.getRuid() ) {
                    me.disconnectRuntime();
                }
    
                // 连接到blob归属的同一个runtime.
                me.connectRuntime( blob.ruid, function() {
                    me.exec('init');
                });
    
                me._blob = blob;
                opts.fileVal = key || opts.fileVal;
                opts.filename = filename || opts.filename;
            },
    
            // 添加其他字段
            append: function( key, value ) {
                if ( typeof key === 'object' ) {
                    $.extend( this._formData, key );
                } else {
                    this._formData[ key ] = value;
                }
            },
    
            setRequestHeader: function( key, value ) {
                if ( typeof key === 'object' ) {
                    $.extend( this._headers, key );
                } else {
                    this._headers[ key ] = value;
                }
            },
    
            send: function( method ) {
                this.exec( 'send', method );
                this._timeout();
            },
    
            abort: function() {
                clearTimeout( this._timer );
                return this.exec('abort');
            },
    
            destroy: function() {
                this.trigger('destroy');
                this.off();
                this.exec('destroy');
                this.disconnectRuntime();
            },
    
            getResponseHeaders: function() {
                return this.exec('getResponseHeaders');
            },
    
            getResponse: function() {
                return this.exec('getResponse');
            },
    
            getResponseAsJson: function() {
                return this.exec('getResponseAsJson');
            },
    
            getStatus: function() {
                return this.exec('getStatus');
            },
    
            _timeout: function() {
                var me = this,
                    duration = me.options.timeout;
    
                if ( !duration ) {
                    return;
                }
    
                clearTimeout( me._timer );
                me._timer = setTimeout(function() {
                    me.abort();
                    me.trigger( 'error', 'timeout' );
                }, duration );
            }
    
        });
    
        // 让Transport具备事件功能。
        Mediator.installTo( Transport.prototype );
    
        return Transport;
    });
    
    /**
     * @fileOverview 负责文件上传相关。
     */
    define('widgets/upload',[
        'base',
        'uploader',
        'file',
        'lib/transport',
        'widgets/widget'
    ], function( Base, Uploader, WUFile, Transport ) {
    
        var $ = Base.$,
            isPromise = Base.isPromise,
            Status = WUFile.Status;
    
        // 添加默认配置项
        $.extend( Uploader.options, {
    
    
            /**
             * @property {Boolean} [prepareNextFile=false]
             * @namespace options
             * @for Uploader
             * @description 是否允许在文件传输时提前把下一个文件准备好。
             * 某些文件的准备工作比较耗时，比如图片压缩，md5序列化。
             * 如果能提前在当前文件传输期处理，可以节省总体耗时。
             */
            prepareNextFile: false,
    
            /**
             * @property {Boolean} [chunked=false]
             * @namespace options
             * @for Uploader
             * @description 是否要分片处理大文件上传。
             */
            chunked: false,
    
            /**
             * @property {Boolean} [chunkSize=5242880]
             * @namespace options
             * @for Uploader
             * @description 如果要分片，分多大一片？ 默认大小为5M.
             */
            chunkSize: 5 * 1024 * 1024,
    
            /**
             * @property {Boolean} [chunkRetry=2]
             * @namespace options
             * @for Uploader
             * @description 如果某个分片由于网络问题出错，允许自动重传多少次？
             */
            chunkRetry: 2,
    
            /**
             * @property {Number} [chunkRetryDelay=1000]
             * @namespace options
             * @for Uploader
             * @description 开启重试后，设置重试延时时间, 单位毫秒。默认1000毫秒，即1秒.
             */
            chunkRetryDelay: 1000,
    
            /**
             * @property {Boolean} [threads=3]
             * @namespace options
             * @for Uploader
             * @description 上传并发数。允许同时最大上传进程数。
             */
            threads: 3,
    
    
            /**
             * @property {Object} [formData={}]
             * @namespace options
             * @for Uploader
             * @description 文件上传请求的参数表，每次发送都会发送此对象中的参数。
             */
            formData: {}
    
            /**
             * @property {Object} [fileVal='file']
             * @namespace options
             * @for Uploader
             * @description 设置文件上传域的name。
             */
    
             /**
             * @property {Object} [method=POST]
             * @namespace options
             * @for Uploader
             * @description 文件上传方式，`POST` 或者 `GET`。
             */
    
            /**
             * @property {Object} [sendAsBinary=false]
             * @namespace options
             * @for Uploader
             * @description 是否已二进制的流的方式发送文件，这样整个上传内容`php://input`都为文件内容，
             * 其他参数在$_GET数组中。
             */
        });
    
        // 负责将文件切片。
        function CuteFile( file, chunkSize ) {
            var pending = [],
                blob = file.source,
                total = blob.size,
                chunks = chunkSize ? Math.ceil( total / chunkSize ) : 1,
                start = 0,
                index = 0,
                len, api;
    
            api = {
                file: file,
    
                has: function() {
                    return !!pending.length;
                },
    
                shift: function() {
                    return pending.shift();
                },
    
                unshift: function( block ) {
                    pending.unshift( block );
                }
            };
    
            while ( index < chunks ) {
                len = Math.min( chunkSize, total - start );
    
                pending.push({
                    file: file,
                    start: start,
                    end: chunkSize ? (start + len) : total,
                    total: total,
                    chunks: chunks,
                    chunk: index++,
                    cuted: api
                });
                start += len;
            }
    
            file.blocks = pending.concat();
            file.remaning = pending.length;
    
            return api;
        }
    
        Uploader.register({
            name: 'upload',
    
            init: function() {
                var owner = this.owner,
                    me = this;
    
                this.runing = false;
                this.progress = false;
    
                owner
                    .on( 'startUpload', function() {
                        me.progress = true;
                    })
                    .on( 'uploadFinished', function() {
                        me.progress = false;
                    });
    
                // 记录当前正在传的数据，跟threads相关
                this.pool = [];
    
                // 缓存分好片的文件。
                this.stack = [];
    
                // 缓存即将上传的文件。
                this.pending = [];
    
                // 跟踪还有多少分片在上传中但是没有完成上传。
                this.remaning = 0;
                this.__tick = Base.bindFn( this._tick, this );
    
                // 销毁上传相关的属性。
                owner.on( 'uploadComplete', function( file ) {
    
                    // 把其他块取消了。
                    file.blocks && $.each( file.blocks, function( _, v ) {
                        v.transport && (v.transport.abort(), v.transport.destroy());
                        delete v.transport;
                    });
    
                    delete file.blocks;
                    delete file.remaning;
                });
            },
    
            reset: function() {
                this.request( 'stop-upload', true );
                this.runing = false;
                this.pool = [];
                this.stack = [];
                this.pending = [];
                this.remaning = 0;
                this._trigged = false;
                this._promise = null;
            },
    
            /**
             * @event startUpload
             * @description 当开始上传流程时触发。
             * @for  Uploader
             */
    
            /**
             * 开始上传。此方法可以从初始状态调用开始上传流程，也可以从暂停状态调用，继续上传流程。
             *
             * 可以指定开始某一个文件。
             * @grammar upload() => undefined
             * @grammar upload( file | fileId) => undefined
             * @method upload
             * @for  Uploader
             */
            startUpload: function(file) {
                var me = this;
    
                // 移出invalid的文件
                $.each( me.request( 'get-files', Status.INVALID ), function() {
                    me.request( 'remove-file', this );
                });
    
                // 如果指定了开始某个文件，则只开始指定的文件。
                if ( file ) {
                    file = file.id ? file : me.request( 'get-file', file );
    
                    if (file.getStatus() === Status.INTERRUPT) {
                        file.setStatus( Status.QUEUED );
    
                        $.each( me.pool, function( _, v ) {
    
                            // 之前暂停过。
                            if (v.file !== file) {
                                return;
                            }
    
                            v.transport && v.transport.send();
                            file.setStatus( Status.PROGRESS );
                        });
    
                        
                    } else if (file.getStatus() !== Status.PROGRESS) {
                        file.setStatus( Status.QUEUED );
                    }
                } else {
                    $.each( me.request( 'get-files', [ Status.INITED ] ), function() {
                        this.setStatus( Status.QUEUED );
                    });
                }
    
                if ( me.runing ) {
                    me.owner.trigger('startUpload', file);// 开始上传或暂停恢复的，trigger event
                    return Base.nextTick( me.__tick );
                }
    
                me.runing = true;
                var files = [];
    
                // 如果有暂停的，则续传
                file || $.each( me.pool, function( _, v ) {
                    var file = v.file;
    
                    if ( file.getStatus() === Status.INTERRUPT ) {
                        me._trigged = false;
                        files.push(file);
    
                        if (v.waiting) {
                            return;
                        }
                        
                        // 文件 prepare 完后，如果暂停了，这个时候只会把文件插入 pool, 而不会创建 tranport，
                        v.transport ? v.transport.send() : me._doSend(v);
                    }
                });
    
                $.each(files, function() {
                    this.setStatus( Status.PROGRESS );
                });
    
                file || $.each( me.request( 'get-files',
                        Status.INTERRUPT ), function() {
                    this.setStatus( Status.PROGRESS );
                });
    
                me._trigged = false;
                Base.nextTick( me.__tick );
                me.owner.trigger('startUpload');
            },
    
            /**
             * @event stopUpload
             * @description 当开始上传流程暂停时触发。
             * @for  Uploader
             */
    
            /**
             * 暂停上传。第一个参数为是否中断上传当前正在上传的文件。
             *
             * 如果第一个参数是文件，则只暂停指定文件。
             * @grammar stop() => undefined
             * @grammar stop( true ) => undefined
             * @grammar stop( file ) => undefined
             * @method stop
             * @for  Uploader
             */
            stopUpload: function( file, interrupt ) {
                var me = this;
    
                if (file === true) {
                    interrupt = file;
                    file = null;
                }
    
                if ( me.runing === false ) {
                    return;
                }
    
                // 如果只是暂停某个文件。
                if ( file ) {
                    file = file.id ? file : me.request( 'get-file', file );
    
                    if ( file.getStatus() !== Status.PROGRESS &&
                            file.getStatus() !== Status.QUEUED ) {
                        return;
                    }
    
                    file.setStatus( Status.INTERRUPT );
    
    
                    $.each( me.pool, function( _, v ) {
    
                        // 只 abort 指定的文件，每一个分片。
                        if (v.file === file) {
                            v.transport && v.transport.abort();
    
                            if (interrupt) {
                                me._putback(v);
                                me._popBlock(v);
                            }
                        }
                    });
    
                    me.owner.trigger('stopUpload', file);// 暂停，trigger event
    
                    return Base.nextTick( me.__tick );
                }
    
                me.runing = false;
    
                // 正在准备中的文件。
                if (this._promise && this._promise.file) {
                    this._promise.file.setStatus( Status.INTERRUPT );
                }
    
                interrupt && $.each( me.pool, function( _, v ) {
                    v.transport && v.transport.abort();
                    v.file.setStatus( Status.INTERRUPT );
                });
    
                me.owner.trigger('stopUpload');
            },
    
            /**
             * @method cancelFile
             * @grammar cancelFile( file ) => undefined
             * @grammar cancelFile( id ) => undefined
             * @param {File|id} file File对象或这File对象的id
             * @description 标记文件状态为已取消, 同时将中断文件传输。
             * @for  Uploader
             * @example
             *
             * $li.on('click', '.remove-this', function() {
             *     uploader.cancelFile( file );
             * })
             */
            cancelFile: function( file ) {
                file = file.id ? file : this.request( 'get-file', file );
    
                // 如果正在上传。
                file.blocks && $.each( file.blocks, function( _, v ) {
                    var _tr = v.transport;
    
                    if ( _tr ) {
                        _tr.abort();
                        _tr.destroy();
                        delete v.transport;
                    }
                });
    
                file.setStatus( Status.CANCELLED );
                this.owner.trigger( 'fileDequeued', file );
            },
    
            /**
             * 判断`Uploader`是否正在上传中。
             * @grammar isInProgress() => Boolean
             * @method isInProgress
             * @for  Uploader
             */
            isInProgress: function() {
                return !!this.progress;
            },
    
            _getStats: function() {
                return this.request('get-stats');
            },
    
            /**
             * 跳过一个文件上传，直接标记指定文件为已上传状态。
             * @grammar skipFile( file ) => undefined
             * @method skipFile
             * @for  Uploader
             */
            skipFile: function( file, status ) {
                file = file.id ? file : this.request( 'get-file', file );
    
                file.setStatus( status || Status.COMPLETE );
                file.skipped = true;
    
                // 如果正在上传。
                file.blocks && $.each( file.blocks, function( _, v ) {
                    var _tr = v.transport;
    
                    if ( _tr ) {
                        _tr.abort();
                        _tr.destroy();
                        delete v.transport;
                    }
                });
    
                this.owner.trigger( 'uploadSkip', file );
            },
    
            /**
             * @event uploadFinished
             * @description 当所有文件上传结束时触发。
             * @for  Uploader
             */
            _tick: function() {
                var me = this,
                    opts = me.options,
                    fn, val;
    
                // 上一个promise还没有结束，则等待完成后再执行。
                if ( me._promise ) {
                    return me._promise.always( me.__tick );
                }
    
                // 还有位置，且还有文件要处理的话。
                if ( me.pool.length < opts.threads && (val = me._nextBlock()) ) {
                    me._trigged = false;
    
                    fn = function( val ) {
                        me._promise = null;
    
                        // 有可能是reject过来的，所以要检测val的类型。
                        val && val.file && me._startSend( val );
                        Base.nextTick( me.__tick );
                    };
    
                    me._promise = isPromise( val ) ? val.always( fn ) : fn( val );
    
                // 没有要上传的了，且没有正在传输的了。
                } else if ( !me.remaning && !me._getStats().numOfQueue &&
                    !me._getStats().numOfInterrupt ) {
                    me.runing = false;
    
                    me._trigged || Base.nextTick(function() {
                        me.owner.trigger('uploadFinished');
                    });
                    me._trigged = true;
                }
            },
    
            _putback: function(block) {
                var idx;
    
                block.cuted.unshift(block);
                idx = this.stack.indexOf(block.cuted);
    
                if (!~idx) {
                    // 如果不在里面，说明移除过，需要把计数还原回去。
                    this.remaning++;
                    block.file.remaning++;
                    this.stack.unshift(block.cuted);
                }
            },
    
            _getStack: function() {
                var i = 0,
                    act;
    
                while ( (act = this.stack[ i++ ]) ) {
                    if ( act.has() && act.file.getStatus() === Status.PROGRESS ) {
                        return act;
                    } else if (!act.has() ||
                            act.file.getStatus() !== Status.PROGRESS &&
                            act.file.getStatus() !== Status.INTERRUPT ) {
    
                        // 把已经处理完了的，或者，状态为非 progress（上传中）、
                        // interupt（暂停中） 的移除。
                        this.stack.splice( --i, 1 );
                    }
                }
    
                return null;
            },
    
            _nextBlock: function() {
                var me = this,
                    opts = me.options,
                    act, next, done, preparing;
    
                // 如果当前文件还有没有需要传输的，则直接返回剩下的。
                if ( (act = this._getStack()) ) {
    
                    // 是否提前准备下一个文件
                    if ( opts.prepareNextFile && !me.pending.length ) {
                        me._prepareNextFile();
                    }
    
                    return act.shift();
    
                // 否则，如果正在运行，则准备下一个文件，并等待完成后返回下个分片。
                } else if ( me.runing ) {
    
                    // 如果缓存中有，则直接在缓存中取，没有则去queue中取。
                    if ( !me.pending.length && me._getStats().numOfQueue ) {
                        me._prepareNextFile();
                    }
    
                    next = me.pending.shift();
                    done = function( file ) {
                        if ( !file ) {
                            return null;
                        }
    
                        act = CuteFile( file, opts.chunked ? opts.chunkSize : 0 );
                        me.stack.push(act);
                        return act.shift();
                    };
    
                    // 文件可能还在prepare中，也有可能已经完全准备好了。
                    if ( isPromise( next) ) {
                        preparing = next.file;
                        next = next[ next.pipe ? 'pipe' : 'then' ]( done );
                        next.file = preparing;
                        return next;
                    }
    
                    return done( next );
                }
            },
    
    
            /**
             * @event uploadStart
             * @param {File} file File对象
             * @description 某个文件开始上传前触发，一个文件只会触发一次。
             * @for  Uploader
             */
            _prepareNextFile: function() {
                var me = this,
                    file = me.request('fetch-file'),
                    pending = me.pending,
                    promise;
    
                if ( file ) {
                    promise = me.request( 'before-send-file', file, function() {
    
                        // 有可能文件被skip掉了。文件被skip掉后，状态坑定不是Queued.
                        if ( file.getStatus() === Status.PROGRESS ||
                            file.getStatus() === Status.INTERRUPT ) {
                            return file;
                        }
    
                        return me._finishFile( file );
                    });
    
                    me.owner.trigger( 'uploadStart', file );
                    file.setStatus( Status.PROGRESS );
    
                    promise.file = file;
    
                    // 如果还在pending中，则替换成文件本身。
                    promise.done(function() {
                        var idx = $.inArray( promise, pending );
    
                        ~idx && pending.splice( idx, 1, file );
                    });
    
                    // befeore-send-file的钩子就有错误发生。
                    promise.fail(function( reason ) {
                        file.setStatus( Status.ERROR, reason );
                        me.owner.trigger( 'uploadError', file, reason );
                        me.owner.trigger( 'uploadComplete', file );
                    });
    
                    pending.push( promise );
                }
            },
    
            // 让出位置了，可以让其他分片开始上传
            _popBlock: function( block ) {
                var idx = $.inArray( block, this.pool );
    
                this.pool.splice( idx, 1 );
                block.file.remaning--;
                this.remaning--;
            },
    
            // 开始上传，可以被掉过。如果promise被reject了，则表示跳过此分片。
            _startSend: function( block ) {
                var me = this,
                    file = block.file,
                    promise;
    
                // 有可能在 before-send-file 的 promise 期间改变了文件状态。
                // 如：暂停，取消
                // 我们不能中断 promise, 但是可以在 promise 完后，不做上传操作。
                if ( file.getStatus() !== Status.PROGRESS ) {
    
                    // 如果是中断，则还需要放回去。
                    if (file.getStatus() === Status.INTERRUPT) {
                        me._putback(block);
                    }
    
                    return;
                }
    
                me.pool.push( block );
                me.remaning++;
    
                // 如果没有分片，则直接使用原始的。
                // 不会丢失content-type信息。
                block.blob = block.chunks === 1 ? file.source :
                        file.source.slice( block.start, block.end );
    
                // hook, 每个分片发送之前可能要做些异步的事情。
                block.waiting = promise = me.request( 'before-send', block, function() {
                    delete block.waiting;
    
                    // 有可能文件已经上传出错了，所以不需要再传输了。
                    if ( file.getStatus() === Status.PROGRESS ) {
                        me._doSend( block );
                    } else if (block.file.getStatus() !== Status.INTERRUPT) {
                        me._popBlock(block);
                    }
    
                    Base.nextTick(me.__tick);
                });
    
                // 如果为fail了，则跳过此分片。
                promise.fail(function() {
                    delete block.waiting;
    
                    if ( file.remaning === 1 ) {
                        me._finishFile( file ).always(function() {
                            block.percentage = 1;
                            me._popBlock( block );
                            me.owner.trigger( 'uploadComplete', file );
                            Base.nextTick( me.__tick );
                        });
                    } else {
                        block.percentage = 1;
                        me.updateFileProgress( file );
                        me._popBlock( block );
                        Base.nextTick( me.__tick );
                    }
                });
            },
    
    
            /**
             * @event uploadBeforeSend
             * @param {Object} object
             * @param {Object} data 默认的上传参数，可以扩展此对象来控制上传参数。
             * @param {Object} headers 可以扩展此对象来控制上传头部。
             * @description 当某个文件的分块在发送前触发，主要用来询问是否要添加附带参数，大文件在开起分片上传的前提下此事件可能会触发多次。
             * @for  Uploader
             */
    
            /**
             * @event uploadAccept
             * @param {Object} object
             * @param {Object} ret 服务端的返回数据，json格式，如果服务端不是json格式，从ret._raw中取数据，自行解析。
             * @description 当某个文件上传到服务端响应后，会派送此事件来询问服务端响应是否有效。如果此事件handler返回值为`false`, 则此文件将派送`server`类型的`uploadError`事件。
             * @for  Uploader
             */
    
            /**
             * @event uploadProgress
             * @param {File} file File对象
             * @param {Number} percentage 上传进度
             * @description 上传过程中触发，携带上传进度。
             * @for  Uploader
             */
    
    
            /**
             * @event uploadError
             * @param {File} file File对象
             * @param {String} reason 出错的code
             * @description 当文件上传出错时触发。
             * @for  Uploader
             */
    
            /**
             * @event uploadSuccess
             * @param {File} file File对象
             * @param {Object} response 服务端返回的数据
             * @description 当文件上传成功时触发。
             * @for  Uploader
             */
    
            /**
             * @event uploadComplete
             * @param {File} [file] File对象
             * @description 不管成功或者失败，文件上传完成时触发。
             * @for  Uploader
             */
    
            // 做上传操作。
            _doSend: function( block ) {
                var me = this,
                    owner = me.owner,
                    opts = $.extend({}, me.options, block.options),
                    file = block.file,
                    tr = new Transport( opts ),
                    data = $.extend({}, opts.formData ),
                    headers = $.extend({}, opts.headers ),
                    requestAccept, ret;
    
                block.transport = tr;
    
                tr.on( 'destroy', function() {
                    delete block.transport;
                    me._popBlock( block );
                    Base.nextTick( me.__tick );
                });
    
                // 广播上传进度。以文件为单位。
                tr.on( 'progress', function( percentage ) {
                    block.percentage = percentage;
                    me.updateFileProgress( file );
                });
    
                // 用来询问，是否返回的结果是有错误的。
                requestAccept = function( reject ) {
                    var fn;
    
                    ret = tr.getResponseAsJson() || {};
                    ret._raw = tr.getResponse();
                    ret._headers = tr.getResponseHeaders();
                    block.response = ret;
                    fn = function( value ) {
                        reject = value;
                    };
    
                    // 服务端响应了，不代表成功了，询问是否响应正确。
                    if ( !owner.trigger( 'uploadAccept', block, ret, fn ) ) {
                        reject = reject || 'server';
                    }
    
                    return reject;
                };
    
                // 尝试重试，然后广播文件上传出错。
                tr.on( 'error', function( type, flag ) {
                    // 在 runtime/html5/transport.js 上为 type 加上了状态码，形式：type|status|text（如：http-403-Forbidden）
                    // 这里把状态码解释出来，并还原后面代码所依赖的 type 变量
                    var typeArr = type.split( '|' ), status, statusText;  
                    type = typeArr[0];
                    status = parseFloat( typeArr[1] ),
                    statusText = typeArr[2];
    
                    block.retried = block.retried || 0;
    
                    // 自动重试
                    if ( block.chunks > 1 && ~'http,abort,server'.indexOf( type.replace( /-.*/, '' ) ) &&
                            block.retried < opts.chunkRetry ) {
    
                        block.retried++;
    
                        me.retryTimer = setTimeout(function() {
                            tr.send();
                        }, opts.chunkRetryDelay || 1000);
    
                    } else {
    
                        // http status 500 ~ 600
                        if ( !flag && type === 'server' ) {
                            type = requestAccept( type );
                        }
    
                        file.setStatus( Status.ERROR, type );
                        owner.trigger( 'uploadError', file, type, status, statusText );
                        owner.trigger( 'uploadComplete', file );
                    }
                });
    
                // 上传成功
                tr.on( 'load', function() {
                    var reason;
    
                    // 如果非预期，转向上传出错。
                    if ( (reason = requestAccept()) ) {
                        tr.trigger( 'error', reason, true );
                        return;
                    }
    
                    // 全部上传完成。
                    if ( file.remaning === 1 ) {
                        me._finishFile( file, ret );
                    } else {
                        tr.destroy();
                    }
                });
    
                // 配置默认的上传字段。
                data = $.extend( data, {
                    id: file.id,
                    name: file.name,
                    type: file.type,
                    lastModifiedDate: file.lastModifiedDate,
                    size: file.size
                });
    
                block.chunks > 1 && $.extend( data, {
                    chunks: block.chunks,
                    chunk: block.chunk
                });
    
                // 在发送之间可以添加字段什么的。。。
                // 如果默认的字段不够使用，可以通过监听此事件来扩展
                owner.trigger( 'uploadBeforeSend', block, data, headers );
    
                // 开始发送。
                tr.appendBlob( opts.fileVal, block.blob, file.name );
                tr.append( data );
                tr.setRequestHeader( headers );
                tr.send();
            },
    
            // 完成上传。
            _finishFile: function( file, ret, hds ) {
                var owner = this.owner;
    
                return owner
                        .request( 'after-send-file', arguments, function() {
                            file.setStatus( Status.COMPLETE );
                            owner.trigger( 'uploadSuccess', file, ret, hds );
                        })
                        .fail(function( reason ) {
    
                            // 如果外部已经标记为invalid什么的，不再改状态。
                            if ( file.getStatus() === Status.PROGRESS ) {
                                file.setStatus( Status.ERROR, reason );
                            }
    
                            owner.trigger( 'uploadError', file, reason );
                        })
                        .always(function() {
                            owner.trigger( 'uploadComplete', file );
                        });
            },
    
            updateFileProgress: function(file) {
                var totalPercent = 0,
                    uploaded = 0;
    
                if (!file.blocks) {
                    return;
                }
    
                $.each( file.blocks, function( _, v ) {
                    uploaded += (v.percentage || 0) * (v.end - v.start);
                });
    
                totalPercent = uploaded / file.size;
                this.owner.trigger( 'uploadProgress', file, totalPercent || 0 );
            },
    
            destroy: function() {
                clearTimeout(this.retryTimer);
            }
    
        });
    });
    
    /**
     * @fileOverview 各种验证，包括文件总大小是否超出、单文件是否超出和文件是否重复。
     */
    
    define('widgets/validator',[
        'base',
        'uploader',
        'file',
        'widgets/widget'
    ], function( Base, Uploader, WUFile ) {
    
        var $ = Base.$,
            validators = {},
            api;
    
        /**
         * @event error
         * @param {String} type 错误类型。
         * @description 当validate不通过时，会以派送错误事件的形式通知调用者。通过`upload.on('error', handler)`可以捕获到此类错误，目前有以下错误会在特定的情况下派送错来。
         *
         * * `Q_EXCEED_NUM_LIMIT` 在设置了`fileNumLimit`且尝试给`uploader`添加的文件数量超出这个值时派送。
         * * `Q_EXCEED_SIZE_LIMIT` 在设置了`Q_EXCEED_SIZE_LIMIT`且尝试给`uploader`添加的文件总大小超出这个值时派送。
         * * `Q_TYPE_DENIED` 当文件类型不满足时触发。。
         * @for  Uploader
         */
    
        // 暴露给外面的api
        api = {
    
            // 添加验证器
            addValidator: function( type, cb ) {
                validators[ type ] = cb;
            },
    
            // 移除验证器
            removeValidator: function( type ) {
                delete validators[ type ];
            }
        };
    
        // 在Uploader初始化的时候启动Validators的初始化
        Uploader.register({
            name: 'validator',
    
            init: function() {
                var me = this;
                Base.nextTick(function() {
                    $.each( validators, function() {
                        this.call( me.owner );
                    });
                });
            }
        });
    
        /**
         * @property {int} [fileNumLimit=undefined]
         * @namespace options
         * @for Uploader
         * @description 验证文件总数量, 超出则不允许加入队列。
         */
        api.addValidator( 'fileNumLimit', function() {
            var uploader = this,
                opts = uploader.options,
                count = 0,
                max = parseInt( opts.fileNumLimit, 10 ),
                flag = true;
    
            if ( !max ) {
                return;
            }
    
            uploader.on( 'beforeFileQueued', function( file ) {
                    // 增加beforeFileQueuedCheckfileNumLimit验证,主要为了再次加载时(已存在历史文件)验证数量是否超过设置项
                if (!this.trigger('beforeFileQueuedCheckfileNumLimit', file,count)) {
                    return false;
                }
                if ( count >= max && flag ) {
                    flag = false;
                    this.trigger( 'error', 'Q_EXCEED_NUM_LIMIT', max, file );
                    setTimeout(function() {
                        flag = true;
                    }, 1 );
                }
    
                return count >= max ? false : true;
            });
    
            uploader.on( 'fileQueued', function() {
                count++;
            });
    
            uploader.on( 'fileDequeued', function() {
                count--;
            });
    
            uploader.on( 'reset', function() {
                count = 0;
            });
        });
    
    
        /**
         * @property {int} [fileSizeLimit=undefined]
         * @namespace options
         * @for Uploader
         * @description 验证文件总大小是否超出限制, 超出则不允许加入队列。
         */
        api.addValidator( 'fileSizeLimit', function() {
            var uploader = this,
                opts = uploader.options,
                count = 0,
                max = parseInt( opts.fileSizeLimit, 10 ),
                flag = true;
    
            if ( !max ) {
                return;
            }
    
            uploader.on( 'beforeFileQueued', function( file ) {
                var invalid = count + file.size > max;
    
                if ( invalid && flag ) {
                    flag = false;
                    this.trigger( 'error', 'Q_EXCEED_SIZE_LIMIT', max, file );
                    setTimeout(function() {
                        flag = true;
                    }, 1 );
                }
    
                return invalid ? false : true;
            });
    
            uploader.on( 'fileQueued', function( file ) {
                count += file.size;
            });
    
            uploader.on( 'fileDequeued', function( file ) {
                count -= file.size;
            });
    
            uploader.on( 'reset', function() {
                count = 0;
            });
        });
    
        /**
         * @property {int} [fileSingleSizeLimit=undefined]
         * @namespace options
         * @for Uploader
         * @description 验证单个文件大小是否超出限制, 超出则不允许加入队列。
         */
        api.addValidator( 'fileSingleSizeLimit', function() {
            var uploader = this,
                opts = uploader.options,
                max = opts.fileSingleSizeLimit;
    
            if ( !max ) {
                return;
            }
    
            uploader.on( 'beforeFileQueued', function( file ) {
    
                if ( file.size > max ) {
                    file.setStatus( WUFile.Status.INVALID, 'exceed_size' );
                    this.trigger( 'error', 'F_EXCEED_SIZE', max, file );
                    return false;
                }
    
            });
    
        });
    
        /**
         * @property {Boolean} [duplicate=undefined]
         * @namespace options
         * @for Uploader
         * @description 去重， 根据文件名字、文件大小和最后修改时间来生成hash Key.
         */
        api.addValidator( 'duplicate', function() {
            var uploader = this,
                opts = uploader.options,
                mapping = {};
    
            if ( opts.duplicate ) {
                return;
            }
    
            function hashString( str ) {
                var hash = 0,
                    i = 0,
                    len = str.length,
                    _char;
    
                for ( ; i < len; i++ ) {
                    _char = str.charCodeAt( i );
                    hash = _char + (hash << 6) + (hash << 16) - hash;
                }
    
                return hash;
            }
    
            uploader.on( 'beforeFileQueued', function( file ) {
                var hash = file.__hash || (file.__hash = hashString( file.name +
                        file.size + file.lastModifiedDate ));
    
                // 已经重复了
                if ( mapping[ hash ] ) {
                    this.trigger( 'error', 'F_DUPLICATE', file );
                    return false;
                }
            });
    
            uploader.on( 'fileQueued', function( file ) {
                var hash = file.__hash;
    
                hash && (mapping[ hash ] = true);
            });
    
            uploader.on( 'fileDequeued', function( file ) {
                var hash = file.__hash;
    
                hash && (delete mapping[ hash ]);
            });
    
            uploader.on( 'reset', function() {
                mapping = {};
            });
        });
    
        return api;
    });
    
    /**
     * @fileOverview Md5
     */
    define('lib/md5',[
        'runtime/client',
        'mediator'
    ], function( RuntimeClient, Mediator ) {
    
        function Md5() {
            RuntimeClient.call( this, 'Md5' );
        }
    
        // 让 Md5 具备事件功能。
        Mediator.installTo( Md5.prototype );
    
        Md5.prototype.loadFromBlob = function( blob ) {
            var me = this;
    
            if ( me.getRuid() ) {
                me.disconnectRuntime();
            }
    
            // 连接到blob归属的同一个runtime.
            me.connectRuntime( blob.ruid, function() {
                me.exec('init');
                me.exec( 'loadFromBlob', blob );
            });
        };
    
        Md5.prototype.getResult = function() {
            return this.exec('getResult');
        };
    
        return Md5;
    });
    /**
     * @fileOverview 图片操作, 负责预览图片和上传前压缩图片
     */
    define('widgets/md5',[
        'base',
        'uploader',
        'lib/md5',
        'lib/blob',
        'widgets/widget'
    ], function( Base, Uploader, Md5, Blob ) {
    
        return Uploader.register({
            name: 'md5',
    
    
            /**
             * 计算文件 md5 值，返回一个 promise 对象，可以监听 progress 进度。
             *
             *
             * @method md5File
             * @grammar md5File( file[, start[, end]] ) => promise
             * @for Uploader
             * @example
             *
             * uploader.on( 'fileQueued', function( file ) {
             *     var $li = ...;
             *
             *     uploader.md5File( file )
             *
             *         // 及时显示进度
             *         .progress(function(percentage) {
             *             console.log('Percentage:', percentage);
             *         })
             *
             *         // 完成
             *         .then(function(val) {
             *             console.log('md5 result:', val);
             *         });
             *
             * });
             */
            md5File: function( file, start, end ) {
                var md5 = new Md5(),
                    deferred = Base.Deferred(),
                    blob = (file instanceof Blob) ? file :
                        this.request( 'get-file', file ).source;
    
                md5.on( 'progress load', function( e ) {
                    e = e || {};
                    deferred.notify( e.total ? e.loaded / e.total : 1 );
                });
    
                md5.on( 'complete', function() {
                    deferred.resolve( md5.getResult() );
                });
    
                md5.on( 'error', function( reason ) {
                    deferred.reject( reason );
                });
    
                if ( arguments.length > 1 ) {
                    start = start || 0;
                    end = end || 0;
                    start < 0 && (start = blob.size + start);
                    end < 0 && (end = blob.size + end);
                    end = Math.min( end, blob.size );
                    blob = blob.slice( start, end );
                }
    
                md5.loadFromBlob( blob );
    
                return deferred.promise();
            }
        });
    });
    /**
     * @fileOverview Runtime管理器，负责Runtime的选择, 连接
     */
    define('runtime/compbase',[],function() {
    
        function CompBase( owner, runtime ) {
    
            this.owner = owner;
            this.options = owner.options;
    
            this.getRuntime = function() {
                return runtime;
            };
    
            this.getRuid = function() {
                return runtime.uid;
            };
    
            this.trigger = function() {
                return owner.trigger.apply( owner, arguments );
            };
        }
    
        return CompBase;
    });
    /**
     * @fileOverview Html5Runtime
     */
    define('runtime/html5/runtime',[
        'base',
        'runtime/runtime',
        'runtime/compbase'
    ], function( Base, Runtime, CompBase ) {
    
        var type = 'html5',
            components = {};
    
        function Html5Runtime() {
            var pool = {},
                me = this,
                destroy = this.destroy;
    
            Runtime.apply( me, arguments );
            me.type = type;
    
    
            // 这个方法的调用者，实际上是RuntimeClient
            me.exec = function( comp, fn/*, args...*/) {
                var client = this,
                    uid = client.uid,
                    args = Base.slice( arguments, 2 ),
                    instance;
    
                if ( components[ comp ] ) {
                    instance = pool[ uid ] = pool[ uid ] ||
                            new components[ comp ]( client, me );
    
                    if ( instance[ fn ] ) {
                        return instance[ fn ].apply( instance, args );
                    }
                }
            };
    
            me.destroy = function() {
                // @todo 删除池子中的所有实例
                return destroy && destroy.apply( this, arguments );
            };
        }
    
        Base.inherits( Runtime, {
            constructor: Html5Runtime,
    
            // 不需要连接其他程序，直接执行callback
            init: function() {
                var me = this;
                setTimeout(function() {
                    me.trigger('ready');
                }, 1 );
            }
    
        });
    
        // 注册Components
        Html5Runtime.register = function( name, component ) {
            var klass = components[ name ] = Base.inherits( CompBase, component );
            return klass;
        };
    
        // 注册html5运行时。
        // 只有在支持的前提下注册。
        if ( window.Blob && window.FileReader && window.DataView ) {
            Runtime.addRuntime( type, Html5Runtime );
        }
    
        return Html5Runtime;
    });
    /**
     * @fileOverview Blob Html实现
     */
    define('runtime/html5/blob',[
        'runtime/html5/runtime',
        'lib/blob'
    ], function( Html5Runtime, Blob ) {
    
        return Html5Runtime.register( 'Blob', {
            slice: function( start, end ) {
                var blob = this.owner.source,
                    slice = blob.slice || blob.webkitSlice || blob.mozSlice;
    
                blob = slice.call( blob, start, end );
    
                return new Blob( this.getRuid(), blob );
            }
        });
    });
    /**
     * @fileOverview FilePaste
     */
    define('runtime/html5/dnd',[
        'base',
        'runtime/html5/runtime',
        'lib/file'
    ], function( Base, Html5Runtime, File ) {
    
        var $ = Base.$,
            prefix = 'webuploader-dnd-';
    
        return Html5Runtime.register( 'DragAndDrop', {
            init: function() {
                var elem = this.elem = this.options.container;
    
                this.dragEnterHandler = Base.bindFn( this._dragEnterHandler, this );
                this.dragOverHandler = Base.bindFn( this._dragOverHandler, this );
                this.dragLeaveHandler = Base.bindFn( this._dragLeaveHandler, this );
                this.dropHandler = Base.bindFn( this._dropHandler, this );
                this.dndOver = false;
    
                elem.on( 'dragenter', this.dragEnterHandler );
                elem.on( 'dragover', this.dragOverHandler );
                elem.on( 'dragleave', this.dragLeaveHandler );
                elem.on( 'drop', this.dropHandler );
    
                if ( this.options.disableGlobalDnd ) {
                    $( document ).on( 'dragover', this.dragOverHandler );
                    $( document ).on( 'drop', this.dropHandler );
                }
            },
    
            _dragEnterHandler: function( e ) {
                var me = this,
                    denied = me._denied || false,
                    items;
    
                e = e.originalEvent || e;
    
                if ( !me.dndOver ) {
                    me.dndOver = true;
    
                    // 注意只有 chrome 支持。
                    items = e.dataTransfer.items;
    
                    if ( items && items.length ) {
                        me._denied = denied = !me.trigger( 'accept', items );
                    }
    
                    me.elem.addClass( prefix + 'over' );
                    me.elem[ denied ? 'addClass' :
                            'removeClass' ]( prefix + 'denied' );
                }
    
                e.dataTransfer.dropEffect = denied ? 'none' : 'copy';
    
                return false;
            },
    
            _dragOverHandler: function( e ) {
                // 只处理框内的。
                var parentElem = this.elem.parent().get( 0 );
                if ( parentElem && !$.contains( parentElem, e.currentTarget ) ) {
                    return false;
                }
    
                clearTimeout( this._leaveTimer );
                this._dragEnterHandler.call( this, e );
    
                return false;
            },
    
            _dragLeaveHandler: function() {
                var me = this,
                    handler;
    
                handler = function() {
                    me.dndOver = false;
                    me.elem.removeClass( prefix + 'over ' + prefix + 'denied' );
                };
    
                clearTimeout( me._leaveTimer );
                me._leaveTimer = setTimeout( handler, 100 );
                return false;
            },
    
            _dropHandler: function( e ) {
                var me = this,
                    ruid = me.getRuid(),
                    parentElem = me.elem.parent().get( 0 ),
                    dataTransfer, data;
    
                // 只处理框内的。
                if ( parentElem && !$.contains( parentElem, e.currentTarget ) ) {
                    return false;
                }
    
                e = e.originalEvent || e;
                dataTransfer = e.dataTransfer;
    
                // 如果是页面内拖拽，还不能处理，不阻止事件。
                // 此处 ie11 下会报参数错误，
                try {
                    data = dataTransfer.getData('text/html');
                } catch( err ) {
                }
    
                me.dndOver = false;
                me.elem.removeClass( prefix + 'over' );
    
                if ( !dataTransfer || data ) {
                    return;
                }
    
                me._getTansferFiles( dataTransfer, function( results ) {
                    me.trigger( 'drop', $.map( results, function( file ) {
                        return new File( ruid, file );
                    }) );
                });
    
                return false;
            },
    
            // 如果传入 callback 则去查看文件夹，否则只管当前文件夹。
            _getTansferFiles: function( dataTransfer, callback ) {
                var results  = [],
                    promises = [],
                    items, files, file, item, i, len, canAccessFolder;
    
                items = dataTransfer.items;
                files = dataTransfer.files;
    
                canAccessFolder = !!(items && items[ 0 ].webkitGetAsEntry);
    
                for ( i = 0, len = files.length; i < len; i++ ) {
                    file = files[ i ];
                    item = items && items[ i ];
    
                    if ( canAccessFolder && item.webkitGetAsEntry().isDirectory ) {
    
                        promises.push( this._traverseDirectoryTree(
                                item.webkitGetAsEntry(), results ) );
                    } else {
                        results.push( file );
                    }
                }
    
                Base.when.apply( Base, promises ).done(function() {
    
                    if ( !results.length ) {
                        return;
                    }
    
                    callback( results );
                });
            },
    
            _traverseDirectoryTree: function( entry, results ) {
                var deferred = Base.Deferred(),
                    me = this;
    
                if ( entry.isFile ) {
                    entry.file(function( file ) {
                        results.push( file );
                        deferred.resolve();
                    });
                } else if ( entry.isDirectory ) {
                    entry.createReader().readEntries(function( entries ) {
                        var len = entries.length,
                            promises = [],
                            arr = [],    // 为了保证顺序。
                            i;
    
                        for ( i = 0; i < len; i++ ) {
                            promises.push( me._traverseDirectoryTree(
                                    entries[ i ], arr ) );
                        }
    
                        Base.when.apply( Base, promises ).then(function() {
                            results.push.apply( results, arr );
                            deferred.resolve();
                        }, deferred.reject );
                    });
                }
    
                return deferred.promise();
            },
    
            destroy: function() {
                var elem = this.elem;
    
                // 还没 init 就调用 destroy
                if (!elem) {
                    return;
                }
    
                elem.off( 'dragenter', this.dragEnterHandler );
                elem.off( 'dragover', this.dragOverHandler );
                elem.off( 'dragleave', this.dragLeaveHandler );
                elem.off( 'drop', this.dropHandler );
    
                if ( this.options.disableGlobalDnd ) {
                    $( document ).off( 'dragover', this.dragOverHandler );
                    $( document ).off( 'drop', this.dropHandler );
                }
            }
        });
    });
    
    /**
     * @fileOverview FilePaste
     */
    define('runtime/html5/filepaste',[
        'base',
        'runtime/html5/runtime',
        'lib/file'
    ], function( Base, Html5Runtime, File ) {
    
        return Html5Runtime.register( 'FilePaste', {
            init: function() {
                var opts = this.options,
                    elem = this.elem = opts.container,
                    accept = '.*',
                    arr, i, len, item;
    
                // accetp的mimeTypes中生成匹配正则。
                if ( opts.accept ) {
                    arr = [];
    
                    for ( i = 0, len = opts.accept.length; i < len; i++ ) {
                        item = opts.accept[ i ].mimeTypes;
                        item && arr.push( item );
                    }
    
                    if ( arr.length ) {
                        accept = arr.join(',');
                        accept = accept.replace( /,/g, '|' ).replace( /\*/g, '.*' );
                    }
                }
                this.accept = accept = new RegExp( accept, 'i' );
                this.hander = Base.bindFn( this._pasteHander, this );
                elem.on( 'paste', this.hander );
            },
    
            _pasteHander: function( e ) {
                var allowed = [],
                    ruid = this.getRuid(),
                    items, item, blob, i, len;
    
                e = e.originalEvent || e;
                items = e.clipboardData.items;
    
                for ( i = 0, len = items.length; i < len; i++ ) {
                    item = items[ i ];
    
                    if ( item.kind !== 'file' || !(blob = item.getAsFile()) ) {
                        continue;
                    }
    
                    allowed.push( new File( ruid, blob ) );
                }
    
                if ( allowed.length ) {
                    // 不阻止非文件粘贴（文字粘贴）的事件冒泡
                    e.preventDefault();
                    e.stopPropagation();
                    this.trigger( 'paste', allowed );
                }
            },
    
            destroy: function() {
                this.elem.off( 'paste', this.hander );
            }
        });
    });
    
    /**
     * @fileOverview FilePicker
     */
    define('runtime/html5/filepicker',[
        'base',
        'runtime/html5/runtime'
    ], function( Base, Html5Runtime ) {
    
        var $ = Base.$;
    
        return Html5Runtime.register( 'FilePicker', {
            init: function() {
                var container = this.getRuntime().getContainer(),
                    me = this,
                    owner = me.owner,
                    opts = me.options,
                    label = this.label = $( document.createElement('label') ),
                    input =  this.input = $( document.createElement('input') ),
                    arr, i, len, mouseHandler, changeHandler;
    
                input.attr( 'type', 'file' );
                input.attr( 'capture', 'camera');
                input.attr( 'name', opts.name );
                input.addClass('webuploader-element-invisible');
    
                label.on( 'click', function(e) {
                    input.trigger('click');
                    e.stopPropagation();
                    owner.trigger('dialogopen');
                });
    
                label.css({
                    opacity: 0,
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    cursor: 'pointer',
                    background: '#ffffff'
                });
    
                if ( opts.multiple ) {
                    input.attr( 'multiple', 'multiple' );
                }
    
                // @todo Firefox不支持单独指定后缀
                if ( opts.accept && opts.accept.length > 0 ) {
                    arr = [];
    
                    for ( i = 0, len = opts.accept.length; i < len; i++ ) {
                        arr.push( opts.accept[ i ].mimeTypes );
                    }
    
                    input.attr( 'accept', arr.join(',') );
                }
    
                container.append( input );
                container.append( label );
    
                mouseHandler = function( e ) {
                    owner.trigger( e.type );
                };
    
                changeHandler = function( e ) {
                    var clone;
    
                    // 解决chrome 56 第二次打开文件选择器，然后点击取消，依然会触发change事件的问题
                    if (e.target.files.length === 0){
                        return false;
                    }
    
                    // 第一次上传图片后，第二次再点击弹出文件选择器窗，等待
                    me.files = e.target.files;
    
    
                    // reset input
                    clone = this.cloneNode( true );
                    clone.value = null;
                    this.parentNode.replaceChild( clone, this );
    
                    input.off();
                    input = $( clone ).on( 'change', changeHandler )
                            .on( 'mouseenter mouseleave', mouseHandler );
    
                    owner.trigger('change');
                }
                input.on( 'change', changeHandler);
                label.on( 'mouseenter mouseleave', mouseHandler );
    
            },
    
    
            getFiles: function() {
                return this.files;
            },
    
            destroy: function() {
                this.input.off();
                this.label.off();
            }
        });
    });
    
    /**
     * Terms:
     *
     * Uint8Array, FileReader, BlobBuilder, atob, ArrayBuffer
     * @fileOverview Image控件
     */
    define('runtime/html5/util',[
        'base'
    ], function( Base ) {
    
        var urlAPI = window.createObjectURL && window ||
                window.URL && URL.revokeObjectURL && URL ||
                window.webkitURL,
            createObjectURL = Base.noop,
            revokeObjectURL = createObjectURL;
    
        if ( urlAPI ) {
    
            // 更安全的方式调用，比如android里面就能把context改成其他的对象。
            createObjectURL = function() {
                return urlAPI.createObjectURL.apply( urlAPI, arguments );
            };
    
            revokeObjectURL = function() {
                return urlAPI.revokeObjectURL.apply( urlAPI, arguments );
            };
        }
    
        return {
            createObjectURL: createObjectURL,
            revokeObjectURL: revokeObjectURL,
    
            dataURL2Blob: function( dataURI ) {
                var byteStr, intArray, ab, i, mimetype, parts;
    
                parts = dataURI.split(',');
    
                if ( ~parts[ 0 ].indexOf('base64') ) {
                    byteStr = atob( parts[ 1 ] );
                } else {
                    byteStr = decodeURIComponent( parts[ 1 ] );
                }
    
                ab = new ArrayBuffer( byteStr.length );
                intArray = new Uint8Array( ab );
    
                for ( i = 0; i < byteStr.length; i++ ) {
                    intArray[ i ] = byteStr.charCodeAt( i );
                }
    
                mimetype = parts[ 0 ].split(':')[ 1 ].split(';')[ 0 ];
    
                return this.arrayBufferToBlob( ab, mimetype );
            },
    
            dataURL2ArrayBuffer: function( dataURI ) {
                var byteStr, intArray, i, parts;
    
                parts = dataURI.split(',');
    
                if ( ~parts[ 0 ].indexOf('base64') ) {
                    byteStr = atob( parts[ 1 ] );
                } else {
                    byteStr = decodeURIComponent( parts[ 1 ] );
                }
    
                intArray = new Uint8Array( byteStr.length );
    
                for ( i = 0; i < byteStr.length; i++ ) {
                    intArray[ i ] = byteStr.charCodeAt( i );
                }
    
                return intArray.buffer;
            },
    
            arrayBufferToBlob: function( buffer, type ) {
                var builder = window.BlobBuilder || window.WebKitBlobBuilder,
                    bb;
    
                // android不支持直接new Blob, 只能借助blobbuilder.
                if ( builder ) {
                    bb = new builder();
                    bb.append( buffer );
                    return bb.getBlob( type );
                }
    
                return new Blob([ buffer ], type ? { type: type } : {} );
            },
    
            // 抽出来主要是为了解决android下面canvas.toDataUrl不支持jpeg.
            // 你得到的结果是png.
            canvasToDataUrl: function( canvas, type, quality ) {
                return canvas.toDataURL( type, quality / 100 );
            },
    
            // imagemeat会复写这个方法，如果用户选择加载那个文件了的话。
            parseMeta: function( blob, callback ) {
                callback( false, {});
            },
    
            // imagemeat会复写这个方法，如果用户选择加载那个文件了的话。
            updateImageHead: function( data ) {
                return data;
            }
        };
    });
    /**
     * Terms:
     *
     * Uint8Array, FileReader, BlobBuilder, atob, ArrayBuffer
     * @fileOverview Image控件
     */
    define('runtime/html5/imagemeta',[
        'runtime/html5/util'
    ], function( Util ) {
    
        var api;
    
        api = {
            parsers: {
                0xffe1: []
            },
    
            maxMetaDataSize: 262144,
    
            parse: function( blob, cb ) {
                var me = this,
                    fr = new FileReader();
    
                fr.onload = function() {
                    cb( false, me._parse( this.result ) );
                    fr = fr.onload = fr.onerror = null;
                };
    
                fr.onerror = function( e ) {
                    cb( e.message );
                    fr = fr.onload = fr.onerror = null;
                };
    
                blob = blob.slice( 0, me.maxMetaDataSize );
                fr.readAsArrayBuffer( blob.getSource() );
            },
    
            _parse: function( buffer, noParse ) {
                if ( buffer.byteLength < 6 ) {
                    return;
                }
    
                var dataview = new DataView( buffer ),
                    offset = 2,
                    maxOffset = dataview.byteLength - 4,
                    headLength = offset,
                    ret = {},
                    markerBytes, markerLength, parsers, i;
    
                if ( dataview.getUint16( 0 ) === 0xffd8 ) {
    
                    while ( offset < maxOffset ) {
                        markerBytes = dataview.getUint16( offset );
    
                        if ( markerBytes >= 0xffe0 && markerBytes <= 0xffef ||
                                markerBytes === 0xfffe ) {
    
                            markerLength = dataview.getUint16( offset + 2 ) + 2;
    
                            if ( offset + markerLength > dataview.byteLength ) {
                                break;
                            }
    
                            parsers = api.parsers[ markerBytes ];
    
                            if ( !noParse && parsers ) {
                                for ( i = 0; i < parsers.length; i += 1 ) {
                                    parsers[ i ].call( api, dataview, offset,
                                            markerLength, ret );
                                }
                            }
    
                            offset += markerLength;
                            headLength = offset;
                        } else {
                            break;
                        }
                    }
    
                    if ( headLength > 6 ) {
                        if ( buffer.slice ) {
                            ret.imageHead = buffer.slice( 2, headLength );
                        } else {
                            // Workaround for IE10, which does not yet
                            // support ArrayBuffer.slice:
                            ret.imageHead = new Uint8Array( buffer )
                                    .subarray( 2, headLength );
                        }
                    }
                }
    
                return ret;
            },
    
            updateImageHead: function( buffer, head ) {
                var data = this._parse( buffer, true ),
                    buf1, buf2, bodyoffset;
    
    
                bodyoffset = 2;
                if ( data.imageHead ) {
                    bodyoffset = 2 + data.imageHead.byteLength;
                }
    
                if ( buffer.slice ) {
                    buf2 = buffer.slice( bodyoffset );
                } else {
                    buf2 = new Uint8Array( buffer ).subarray( bodyoffset );
                }
    
                buf1 = new Uint8Array( head.byteLength + 2 + buf2.byteLength );
    
                buf1[ 0 ] = 0xFF;
                buf1[ 1 ] = 0xD8;
                buf1.set( new Uint8Array( head ), 2 );
                buf1.set( new Uint8Array( buf2 ), head.byteLength + 2 );
    
                return buf1.buffer;
            }
        };
    
        Util.parseMeta = function() {
            return api.parse.apply( api, arguments );
        };
    
        Util.updateImageHead = function() {
            return api.updateImageHead.apply( api, arguments );
        };
    
        return api;
    });
    /**
     * 代码来自于：https://github.com/blueimp/JavaScript-Load-Image
     * 暂时项目中只用了orientation.
     *
     * 去除了 Exif Sub IFD Pointer, GPS Info IFD Pointer, Exif Thumbnail.
     * @fileOverview EXIF解析
     */
    
    // Sample
    // ====================================
    // Make : Apple
    // Model : iPhone 4S
    // Orientation : 1
    // XResolution : 72 [72/1]
    // YResolution : 72 [72/1]
    // ResolutionUnit : 2
    // Software : QuickTime 7.7.1
    // DateTime : 2013:09:01 22:53:55
    // ExifIFDPointer : 190
    // ExposureTime : 0.058823529411764705 [1/17]
    // FNumber : 2.4 [12/5]
    // ExposureProgram : Normal program
    // ISOSpeedRatings : 800
    // ExifVersion : 0220
    // DateTimeOriginal : 2013:09:01 22:52:51
    // DateTimeDigitized : 2013:09:01 22:52:51
    // ComponentsConfiguration : YCbCr
    // ShutterSpeedValue : 4.058893515764426
    // ApertureValue : 2.5260688216892597 [4845/1918]
    // BrightnessValue : -0.3126686601998395
    // MeteringMode : Pattern
    // Flash : Flash did not fire, compulsory flash mode
    // FocalLength : 4.28 [107/25]
    // SubjectArea : [4 values]
    // FlashpixVersion : 0100
    // ColorSpace : 1
    // PixelXDimension : 2448
    // PixelYDimension : 3264
    // SensingMethod : One-chip color area sensor
    // ExposureMode : 0
    // WhiteBalance : Auto white balance
    // FocalLengthIn35mmFilm : 35
    // SceneCaptureType : Standard
    define('runtime/html5/imagemeta/exif',[
        'base',
        'runtime/html5/imagemeta'
    ], function( Base, ImageMeta ) {
    
        var EXIF = {};
    
        EXIF.ExifMap = function() {
            return this;
        };
    
        EXIF.ExifMap.prototype.map = {
            'Orientation': 0x0112
        };
    
        EXIF.ExifMap.prototype.get = function( id ) {
            return this[ id ] || this[ this.map[ id ] ];
        };
    
        EXIF.exifTagTypes = {
            // byte, 8-bit unsigned int:
            1: {
                getValue: function( dataView, dataOffset ) {
                    return dataView.getUint8( dataOffset );
                },
                size: 1
            },
    
            // ascii, 8-bit byte:
            2: {
                getValue: function( dataView, dataOffset ) {
                    return String.fromCharCode( dataView.getUint8( dataOffset ) );
                },
                size: 1,
                ascii: true
            },
    
            // short, 16 bit int:
            3: {
                getValue: function( dataView, dataOffset, littleEndian ) {
                    return dataView.getUint16( dataOffset, littleEndian );
                },
                size: 2
            },
    
            // long, 32 bit int:
            4: {
                getValue: function( dataView, dataOffset, littleEndian ) {
                    return dataView.getUint32( dataOffset, littleEndian );
                },
                size: 4
            },
    
            // rational = two long values,
            // first is numerator, second is denominator:
            5: {
                getValue: function( dataView, dataOffset, littleEndian ) {
                    return dataView.getUint32( dataOffset, littleEndian ) /
                        dataView.getUint32( dataOffset + 4, littleEndian );
                },
                size: 8
            },
    
            // slong, 32 bit signed int:
            9: {
                getValue: function( dataView, dataOffset, littleEndian ) {
                    return dataView.getInt32( dataOffset, littleEndian );
                },
                size: 4
            },
    
            // srational, two slongs, first is numerator, second is denominator:
            10: {
                getValue: function( dataView, dataOffset, littleEndian ) {
                    return dataView.getInt32( dataOffset, littleEndian ) /
                        dataView.getInt32( dataOffset + 4, littleEndian );
                },
                size: 8
            }
        };
    
        // undefined, 8-bit byte, value depending on field:
        EXIF.exifTagTypes[ 7 ] = EXIF.exifTagTypes[ 1 ];
    
        EXIF.getExifValue = function( dataView, tiffOffset, offset, type, length,
                littleEndian ) {
    
            var tagType = EXIF.exifTagTypes[ type ],
                tagSize, dataOffset, values, i, str, c;
    
            if ( !tagType ) {
                Base.log('Invalid Exif data: Invalid tag type.');
                return;
            }
    
            tagSize = tagType.size * length;
    
            // Determine if the value is contained in the dataOffset bytes,
            // or if the value at the dataOffset is a pointer to the actual data:
            dataOffset = tagSize > 4 ? tiffOffset + dataView.getUint32( offset + 8,
                    littleEndian ) : (offset + 8);
    
            if ( dataOffset + tagSize > dataView.byteLength ) {
                Base.log('Invalid Exif data: Invalid data offset.');
                return;
            }
    
            if ( length === 1 ) {
                return tagType.getValue( dataView, dataOffset, littleEndian );
            }
    
            values = [];
    
            for ( i = 0; i < length; i += 1 ) {
                values[ i ] = tagType.getValue( dataView,
                        dataOffset + i * tagType.size, littleEndian );
            }
    
            if ( tagType.ascii ) {
                str = '';
    
                // Concatenate the chars:
                for ( i = 0; i < values.length; i += 1 ) {
                    c = values[ i ];
    
                    // Ignore the terminating NULL byte(s):
                    if ( c === '\u0000' ) {
                        break;
                    }
                    str += c;
                }
    
                return str;
            }
            return values;
        };
    
        EXIF.parseExifTag = function( dataView, tiffOffset, offset, littleEndian,
                data ) {
    
            var tag = dataView.getUint16( offset, littleEndian );
            data.exif[ tag ] = EXIF.getExifValue( dataView, tiffOffset, offset,
                    dataView.getUint16( offset + 2, littleEndian ),    // tag type
                    dataView.getUint32( offset + 4, littleEndian ),    // tag length
                    littleEndian );
        };
    
        EXIF.parseExifTags = function( dataView, tiffOffset, dirOffset,
                littleEndian, data ) {
    
            var tagsNumber, dirEndOffset, i;
    
            if ( dirOffset + 6 > dataView.byteLength ) {
                Base.log('Invalid Exif data: Invalid directory offset.');
                return;
            }
    
            tagsNumber = dataView.getUint16( dirOffset, littleEndian );
            dirEndOffset = dirOffset + 2 + 12 * tagsNumber;
    
            if ( dirEndOffset + 4 > dataView.byteLength ) {
                Base.log('Invalid Exif data: Invalid directory size.');
                return;
            }
    
            for ( i = 0; i < tagsNumber; i += 1 ) {
                this.parseExifTag( dataView, tiffOffset,
                        dirOffset + 2 + 12 * i,    // tag offset
                        littleEndian, data );
            }
    
            // Return the offset to the next directory:
            return dataView.getUint32( dirEndOffset, littleEndian );
        };
    
        // EXIF.getExifThumbnail = function(dataView, offset, length) {
        //     var hexData,
        //         i,
        //         b;
        //     if (!length || offset + length > dataView.byteLength) {
        //         Base.log('Invalid Exif data: Invalid thumbnail data.');
        //         return;
        //     }
        //     hexData = [];
        //     for (i = 0; i < length; i += 1) {
        //         b = dataView.getUint8(offset + i);
        //         hexData.push((b < 16 ? '0' : '') + b.toString(16));
        //     }
        //     return 'data:image/jpeg,%' + hexData.join('%');
        // };
    
        EXIF.parseExifData = function( dataView, offset, length, data ) {
    
            var tiffOffset = offset + 10,
                littleEndian, dirOffset;
    
            // Check for the ASCII code for "Exif" (0x45786966):
            if ( dataView.getUint32( offset + 4 ) !== 0x45786966 ) {
                // No Exif data, might be XMP data instead
                return;
            }
            if ( tiffOffset + 8 > dataView.byteLength ) {
                Base.log('Invalid Exif data: Invalid segment size.');
                return;
            }
    
            // Check for the two null bytes:
            if ( dataView.getUint16( offset + 8 ) !== 0x0000 ) {
                Base.log('Invalid Exif data: Missing byte alignment offset.');
                return;
            }
    
            // Check the byte alignment:
            switch ( dataView.getUint16( tiffOffset ) ) {
                case 0x4949:
                    littleEndian = true;
                    break;
    
                case 0x4D4D:
                    littleEndian = false;
                    break;
    
                default:
                    Base.log('Invalid Exif data: Invalid byte alignment marker.');
                    return;
            }
    
            // Check for the TIFF tag marker (0x002A):
            if ( dataView.getUint16( tiffOffset + 2, littleEndian ) !== 0x002A ) {
                Base.log('Invalid Exif data: Missing TIFF marker.');
                return;
            }
    
            // Retrieve the directory offset bytes, usually 0x00000008 or 8 decimal:
            dirOffset = dataView.getUint32( tiffOffset + 4, littleEndian );
            // Create the exif object to store the tags:
            data.exif = new EXIF.ExifMap();
            // Parse the tags of the main image directory and retrieve the
            // offset to the next directory, usually the thumbnail directory:
            dirOffset = EXIF.parseExifTags( dataView, tiffOffset,
                    tiffOffset + dirOffset, littleEndian, data );
    
            // 尝试读取缩略图
            // if ( dirOffset ) {
            //     thumbnailData = {exif: {}};
            //     dirOffset = EXIF.parseExifTags(
            //         dataView,
            //         tiffOffset,
            //         tiffOffset + dirOffset,
            //         littleEndian,
            //         thumbnailData
            //     );
    
            //     // Check for JPEG Thumbnail offset:
            //     if (thumbnailData.exif[0x0201]) {
            //         data.exif.Thumbnail = EXIF.getExifThumbnail(
            //             dataView,
            //             tiffOffset + thumbnailData.exif[0x0201],
            //             thumbnailData.exif[0x0202] // Thumbnail data length
            //         );
            //     }
            // }
        };
    
        ImageMeta.parsers[ 0xffe1 ].push( EXIF.parseExifData );
        return EXIF;
    });
    /**
     * 这个方式性能不行，但是可以解决android里面的toDataUrl的bug
     * android里面toDataUrl('image/jpege')得到的结果却是png.
     *
     * 所以这里没辙，只能借助这个工具
     * @fileOverview jpeg encoder
     */
    define('runtime/html5/jpegencoder',[], function( require, exports, module ) {
    
        /*
          Copyright (c) 2008, Adobe Systems Incorporated
          All rights reserved.
    
          Redistribution and use in source and binary forms, with or without
          modification, are permitted provided that the following conditions are
          met:
    
          * Redistributions of source code must retain the above copyright notice,
            this list of conditions and the following disclaimer.
    
          * Redistributions in binary form must reproduce the above copyright
            notice, this list of conditions and the following disclaimer in the
            documentation and/or other materials provided with the distribution.
    
          * Neither the name of Adobe Systems Incorporated nor the names of its
            contributors may be used to endorse or promote products derived from
            this software without specific prior written permission.
    
          THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
          IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
          THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
          PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
          CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
          EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
          PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
          PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
          LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
          NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
          SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
        */
        /*
        JPEG encoder ported to JavaScript and optimized by Andreas Ritter, www.bytestrom.eu, 11/2009
    
        Basic GUI blocking jpeg encoder
        */
    
        function JPEGEncoder(quality) {
          var self = this;
            var fround = Math.round;
            var ffloor = Math.floor;
            var YTable = new Array(64);
            var UVTable = new Array(64);
            var fdtbl_Y = new Array(64);
            var fdtbl_UV = new Array(64);
            var YDC_HT;
            var UVDC_HT;
            var YAC_HT;
            var UVAC_HT;
    
            var bitcode = new Array(65535);
            var category = new Array(65535);
            var outputfDCTQuant = new Array(64);
            var DU = new Array(64);
            var byteout = [];
            var bytenew = 0;
            var bytepos = 7;
    
            var YDU = new Array(64);
            var UDU = new Array(64);
            var VDU = new Array(64);
            var clt = new Array(256);
            var RGB_YUV_TABLE = new Array(2048);
            var currentQuality;
    
            var ZigZag = [
                     0, 1, 5, 6,14,15,27,28,
                     2, 4, 7,13,16,26,29,42,
                     3, 8,12,17,25,30,41,43,
                     9,11,18,24,31,40,44,53,
                    10,19,23,32,39,45,52,54,
                    20,22,33,38,46,51,55,60,
                    21,34,37,47,50,56,59,61,
                    35,36,48,49,57,58,62,63
                ];
    
            var std_dc_luminance_nrcodes = [0,0,1,5,1,1,1,1,1,1,0,0,0,0,0,0,0];
            var std_dc_luminance_values = [0,1,2,3,4,5,6,7,8,9,10,11];
            var std_ac_luminance_nrcodes = [0,0,2,1,3,3,2,4,3,5,5,4,4,0,0,1,0x7d];
            var std_ac_luminance_values = [
                    0x01,0x02,0x03,0x00,0x04,0x11,0x05,0x12,
                    0x21,0x31,0x41,0x06,0x13,0x51,0x61,0x07,
                    0x22,0x71,0x14,0x32,0x81,0x91,0xa1,0x08,
                    0x23,0x42,0xb1,0xc1,0x15,0x52,0xd1,0xf0,
                    0x24,0x33,0x62,0x72,0x82,0x09,0x0a,0x16,
                    0x17,0x18,0x19,0x1a,0x25,0x26,0x27,0x28,
                    0x29,0x2a,0x34,0x35,0x36,0x37,0x38,0x39,
                    0x3a,0x43,0x44,0x45,0x46,0x47,0x48,0x49,
                    0x4a,0x53,0x54,0x55,0x56,0x57,0x58,0x59,
                    0x5a,0x63,0x64,0x65,0x66,0x67,0x68,0x69,
                    0x6a,0x73,0x74,0x75,0x76,0x77,0x78,0x79,
                    0x7a,0x83,0x84,0x85,0x86,0x87,0x88,0x89,
                    0x8a,0x92,0x93,0x94,0x95,0x96,0x97,0x98,
                    0x99,0x9a,0xa2,0xa3,0xa4,0xa5,0xa6,0xa7,
                    0xa8,0xa9,0xaa,0xb2,0xb3,0xb4,0xb5,0xb6,
                    0xb7,0xb8,0xb9,0xba,0xc2,0xc3,0xc4,0xc5,
                    0xc6,0xc7,0xc8,0xc9,0xca,0xd2,0xd3,0xd4,
                    0xd5,0xd6,0xd7,0xd8,0xd9,0xda,0xe1,0xe2,
                    0xe3,0xe4,0xe5,0xe6,0xe7,0xe8,0xe9,0xea,
                    0xf1,0xf2,0xf3,0xf4,0xf5,0xf6,0xf7,0xf8,
                    0xf9,0xfa
                ];
    
            var std_dc_chrominance_nrcodes = [0,0,3,1,1,1,1,1,1,1,1,1,0,0,0,0,0];
            var std_dc_chrominance_values = [0,1,2,3,4,5,6,7,8,9,10,11];
            var std_ac_chrominance_nrcodes = [0,0,2,1,2,4,4,3,4,7,5,4,4,0,1,2,0x77];
            var std_ac_chrominance_values = [
                    0x00,0x01,0x02,0x03,0x11,0x04,0x05,0x21,
                    0x31,0x06,0x12,0x41,0x51,0x07,0x61,0x71,
                    0x13,0x22,0x32,0x81,0x08,0x14,0x42,0x91,
                    0xa1,0xb1,0xc1,0x09,0x23,0x33,0x52,0xf0,
                    0x15,0x62,0x72,0xd1,0x0a,0x16,0x24,0x34,
                    0xe1,0x25,0xf1,0x17,0x18,0x19,0x1a,0x26,
                    0x27,0x28,0x29,0x2a,0x35,0x36,0x37,0x38,
                    0x39,0x3a,0x43,0x44,0x45,0x46,0x47,0x48,
                    0x49,0x4a,0x53,0x54,0x55,0x56,0x57,0x58,
                    0x59,0x5a,0x63,0x64,0x65,0x66,0x67,0x68,
                    0x69,0x6a,0x73,0x74,0x75,0x76,0x77,0x78,
                    0x79,0x7a,0x82,0x83,0x84,0x85,0x86,0x87,
                    0x88,0x89,0x8a,0x92,0x93,0x94,0x95,0x96,
                    0x97,0x98,0x99,0x9a,0xa2,0xa3,0xa4,0xa5,
                    0xa6,0xa7,0xa8,0xa9,0xaa,0xb2,0xb3,0xb4,
                    0xb5,0xb6,0xb7,0xb8,0xb9,0xba,0xc2,0xc3,
                    0xc4,0xc5,0xc6,0xc7,0xc8,0xc9,0xca,0xd2,
                    0xd3,0xd4,0xd5,0xd6,0xd7,0xd8,0xd9,0xda,
                    0xe2,0xe3,0xe4,0xe5,0xe6,0xe7,0xe8,0xe9,
                    0xea,0xf2,0xf3,0xf4,0xf5,0xf6,0xf7,0xf8,
                    0xf9,0xfa
                ];
    
            function initQuantTables(sf){
                    var YQT = [
                        16, 11, 10, 16, 24, 40, 51, 61,
                        12, 12, 14, 19, 26, 58, 60, 55,
                        14, 13, 16, 24, 40, 57, 69, 56,
                        14, 17, 22, 29, 51, 87, 80, 62,
                        18, 22, 37, 56, 68,109,103, 77,
                        24, 35, 55, 64, 81,104,113, 92,
                        49, 64, 78, 87,103,121,120,101,
                        72, 92, 95, 98,112,100,103, 99
                    ];
    
                    for (var i = 0; i < 64; i++) {
                        var t = ffloor((YQT[i]*sf+50)/100);
                        if (t < 1) {
                            t = 1;
                        } else if (t > 255) {
                            t = 255;
                        }
                        YTable[ZigZag[i]] = t;
                    }
                    var UVQT = [
                        17, 18, 24, 47, 99, 99, 99, 99,
                        18, 21, 26, 66, 99, 99, 99, 99,
                        24, 26, 56, 99, 99, 99, 99, 99,
                        47, 66, 99, 99, 99, 99, 99, 99,
                        99, 99, 99, 99, 99, 99, 99, 99,
                        99, 99, 99, 99, 99, 99, 99, 99,
                        99, 99, 99, 99, 99, 99, 99, 99,
                        99, 99, 99, 99, 99, 99, 99, 99
                    ];
                    for (var j = 0; j < 64; j++) {
                        var u = ffloor((UVQT[j]*sf+50)/100);
                        if (u < 1) {
                            u = 1;
                        } else if (u > 255) {
                            u = 255;
                        }
                        UVTable[ZigZag[j]] = u;
                    }
                    var aasf = [
                        1.0, 1.387039845, 1.306562965, 1.175875602,
                        1.0, 0.785694958, 0.541196100, 0.275899379
                    ];
                    var k = 0;
                    for (var row = 0; row < 8; row++)
                    {
                        for (var col = 0; col < 8; col++)
                        {
                            fdtbl_Y[k]  = (1.0 / (YTable [ZigZag[k]] * aasf[row] * aasf[col] * 8.0));
                            fdtbl_UV[k] = (1.0 / (UVTable[ZigZag[k]] * aasf[row] * aasf[col] * 8.0));
                            k++;
                        }
                    }
                }
    
                function computeHuffmanTbl(nrcodes, std_table){
                    var codevalue = 0;
                    var pos_in_table = 0;
                    var HT = new Array();
                    for (var k = 1; k <= 16; k++) {
                        for (var j = 1; j <= nrcodes[k]; j++) {
                            HT[std_table[pos_in_table]] = [];
                            HT[std_table[pos_in_table]][0] = codevalue;
                            HT[std_table[pos_in_table]][1] = k;
                            pos_in_table++;
                            codevalue++;
                        }
                        codevalue*=2;
                    }
                    return HT;
                }
    
                function initHuffmanTbl()
                {
                    YDC_HT = computeHuffmanTbl(std_dc_luminance_nrcodes,std_dc_luminance_values);
                    UVDC_HT = computeHuffmanTbl(std_dc_chrominance_nrcodes,std_dc_chrominance_values);
                    YAC_HT = computeHuffmanTbl(std_ac_luminance_nrcodes,std_ac_luminance_values);
                    UVAC_HT = computeHuffmanTbl(std_ac_chrominance_nrcodes,std_ac_chrominance_values);
                }
    
                function initCategoryNumber()
                {
                    var nrlower = 1;
                    var nrupper = 2;
                    for (var cat = 1; cat <= 15; cat++) {
                        //Positive numbers
                        for (var nr = nrlower; nr<nrupper; nr++) {
                            category[32767+nr] = cat;
                            bitcode[32767+nr] = [];
                            bitcode[32767+nr][1] = cat;
                            bitcode[32767+nr][0] = nr;
                        }
                        //Negative numbers
                        for (var nrneg =-(nrupper-1); nrneg<=-nrlower; nrneg++) {
                            category[32767+nrneg] = cat;
                            bitcode[32767+nrneg] = [];
                            bitcode[32767+nrneg][1] = cat;
                            bitcode[32767+nrneg][0] = nrupper-1+nrneg;
                        }
                        nrlower <<= 1;
                        nrupper <<= 1;
                    }
                }
    
                function initRGBYUVTable() {
                    for(var i = 0; i < 256;i++) {
                        RGB_YUV_TABLE[i]            =  19595 * i;
                        RGB_YUV_TABLE[(i+ 256)>>0]  =  38470 * i;
                        RGB_YUV_TABLE[(i+ 512)>>0]  =   7471 * i + 0x8000;
                        RGB_YUV_TABLE[(i+ 768)>>0]  = -11059 * i;
                        RGB_YUV_TABLE[(i+1024)>>0]  = -21709 * i;
                        RGB_YUV_TABLE[(i+1280)>>0]  =  32768 * i + 0x807FFF;
                        RGB_YUV_TABLE[(i+1536)>>0]  = -27439 * i;
                        RGB_YUV_TABLE[(i+1792)>>0]  = - 5329 * i;
                    }
                }
    
                // IO functions
                function writeBits(bs)
                {
                    var value = bs[0];
                    var posval = bs[1]-1;
                    while ( posval >= 0 ) {
                        if (value & (1 << posval) ) {
                            bytenew |= (1 << bytepos);
                        }
                        posval--;
                        bytepos--;
                        if (bytepos < 0) {
                            if (bytenew == 0xFF) {
                                writeByte(0xFF);
                                writeByte(0);
                            }
                            else {
                                writeByte(bytenew);
                            }
                            bytepos=7;
                            bytenew=0;
                        }
                    }
                }
    
                function writeByte(value)
                {
                    byteout.push(clt[value]); // write char directly instead of converting later
                }
    
                function writeWord(value)
                {
                    writeByte((value>>8)&0xFF);
                    writeByte((value   )&0xFF);
                }
    
                // DCT & quantization core
                function fDCTQuant(data, fdtbl)
                {
                    var d0, d1, d2, d3, d4, d5, d6, d7;
                    /* Pass 1: process rows. */
                    var dataOff=0;
                    var i;
                    var I8 = 8;
                    var I64 = 64;
                    for (i=0; i<I8; ++i)
                    {
                        d0 = data[dataOff];
                        d1 = data[dataOff+1];
                        d2 = data[dataOff+2];
                        d3 = data[dataOff+3];
                        d4 = data[dataOff+4];
                        d5 = data[dataOff+5];
                        d6 = data[dataOff+6];
                        d7 = data[dataOff+7];
    
                        var tmp0 = d0 + d7;
                        var tmp7 = d0 - d7;
                        var tmp1 = d1 + d6;
                        var tmp6 = d1 - d6;
                        var tmp2 = d2 + d5;
                        var tmp5 = d2 - d5;
                        var tmp3 = d3 + d4;
                        var tmp4 = d3 - d4;
    
                        /* Even part */
                        var tmp10 = tmp0 + tmp3;    /* phase 2 */
                        var tmp13 = tmp0 - tmp3;
                        var tmp11 = tmp1 + tmp2;
                        var tmp12 = tmp1 - tmp2;
    
                        data[dataOff] = tmp10 + tmp11; /* phase 3 */
                        data[dataOff+4] = tmp10 - tmp11;
    
                        var z1 = (tmp12 + tmp13) * 0.707106781; /* c4 */
                        data[dataOff+2] = tmp13 + z1; /* phase 5 */
                        data[dataOff+6] = tmp13 - z1;
    
                        /* Odd part */
                        tmp10 = tmp4 + tmp5; /* phase 2 */
                        tmp11 = tmp5 + tmp6;
                        tmp12 = tmp6 + tmp7;
    
                        /* The rotator is modified from fig 4-8 to avoid extra negations. */
                        var z5 = (tmp10 - tmp12) * 0.382683433; /* c6 */
                        var z2 = 0.541196100 * tmp10 + z5; /* c2-c6 */
                        var z4 = 1.306562965 * tmp12 + z5; /* c2+c6 */
                        var z3 = tmp11 * 0.707106781; /* c4 */
    
                        var z11 = tmp7 + z3;    /* phase 5 */
                        var z13 = tmp7 - z3;
    
                        data[dataOff+5] = z13 + z2; /* phase 6 */
                        data[dataOff+3] = z13 - z2;
                        data[dataOff+1] = z11 + z4;
                        data[dataOff+7] = z11 - z4;
    
                        dataOff += 8; /* advance pointer to next row */
                    }
    
                    /* Pass 2: process columns. */
                    dataOff = 0;
                    for (i=0; i<I8; ++i)
                    {
                        d0 = data[dataOff];
                        d1 = data[dataOff + 8];
                        d2 = data[dataOff + 16];
                        d3 = data[dataOff + 24];
                        d4 = data[dataOff + 32];
                        d5 = data[dataOff + 40];
                        d6 = data[dataOff + 48];
                        d7 = data[dataOff + 56];
    
                        var tmp0p2 = d0 + d7;
                        var tmp7p2 = d0 - d7;
                        var tmp1p2 = d1 + d6;
                        var tmp6p2 = d1 - d6;
                        var tmp2p2 = d2 + d5;
                        var tmp5p2 = d2 - d5;
                        var tmp3p2 = d3 + d4;
                        var tmp4p2 = d3 - d4;
    
                        /* Even part */
                        var tmp10p2 = tmp0p2 + tmp3p2;  /* phase 2 */
                        var tmp13p2 = tmp0p2 - tmp3p2;
                        var tmp11p2 = tmp1p2 + tmp2p2;
                        var tmp12p2 = tmp1p2 - tmp2p2;
    
                        data[dataOff] = tmp10p2 + tmp11p2; /* phase 3 */
                        data[dataOff+32] = tmp10p2 - tmp11p2;
    
                        var z1p2 = (tmp12p2 + tmp13p2) * 0.707106781; /* c4 */
                        data[dataOff+16] = tmp13p2 + z1p2; /* phase 5 */
                        data[dataOff+48] = tmp13p2 - z1p2;
    
                        /* Odd part */
                        tmp10p2 = tmp4p2 + tmp5p2; /* phase 2 */
                        tmp11p2 = tmp5p2 + tmp6p2;
                        tmp12p2 = tmp6p2 + tmp7p2;
    
                        /* The rotator is modified from fig 4-8 to avoid extra negations. */
                        var z5p2 = (tmp10p2 - tmp12p2) * 0.382683433; /* c6 */
                        var z2p2 = 0.541196100 * tmp10p2 + z5p2; /* c2-c6 */
                        var z4p2 = 1.306562965 * tmp12p2 + z5p2; /* c2+c6 */
                        var z3p2 = tmp11p2 * 0.707106781; /* c4 */
    
                        var z11p2 = tmp7p2 + z3p2;  /* phase 5 */
                        var z13p2 = tmp7p2 - z3p2;
    
                        data[dataOff+40] = z13p2 + z2p2; /* phase 6 */
                        data[dataOff+24] = z13p2 - z2p2;
                        data[dataOff+ 8] = z11p2 + z4p2;
                        data[dataOff+56] = z11p2 - z4p2;
    
                        dataOff++; /* advance pointer to next column */
                    }
    
                    // Quantize/descale the coefficients
                    var fDCTQuant;
                    for (i=0; i<I64; ++i)
                    {
                        // Apply the quantization and scaling factor & Round to nearest integer
                        fDCTQuant = data[i]*fdtbl[i];
                        outputfDCTQuant[i] = (fDCTQuant > 0.0) ? ((fDCTQuant + 0.5)|0) : ((fDCTQuant - 0.5)|0);
                        //outputfDCTQuant[i] = fround(fDCTQuant);
    
                    }
                    return outputfDCTQuant;
                }
    
                function writeAPP0()
                {
                    writeWord(0xFFE0); // marker
                    writeWord(16); // length
                    writeByte(0x4A); // J
                    writeByte(0x46); // F
                    writeByte(0x49); // I
                    writeByte(0x46); // F
                    writeByte(0); // = "JFIF",'\0'
                    writeByte(1); // versionhi
                    writeByte(1); // versionlo
                    writeByte(0); // xyunits
                    writeWord(1); // xdensity
                    writeWord(1); // ydensity
                    writeByte(0); // thumbnwidth
                    writeByte(0); // thumbnheight
                }
    
                function writeSOF0(width, height)
                {
                    writeWord(0xFFC0); // marker
                    writeWord(17);   // length, truecolor YUV JPG
                    writeByte(8);    // precision
                    writeWord(height);
                    writeWord(width);
                    writeByte(3);    // nrofcomponents
                    writeByte(1);    // IdY
                    writeByte(0x11); // HVY
                    writeByte(0);    // QTY
                    writeByte(2);    // IdU
                    writeByte(0x11); // HVU
                    writeByte(1);    // QTU
                    writeByte(3);    // IdV
                    writeByte(0x11); // HVV
                    writeByte(1);    // QTV
                }
    
                function writeDQT()
                {
                    writeWord(0xFFDB); // marker
                    writeWord(132);    // length
                    writeByte(0);
                    for (var i=0; i<64; i++) {
                        writeByte(YTable[i]);
                    }
                    writeByte(1);
                    for (var j=0; j<64; j++) {
                        writeByte(UVTable[j]);
                    }
                }
    
                function writeDHT()
                {
                    writeWord(0xFFC4); // marker
                    writeWord(0x01A2); // length
    
                    writeByte(0); // HTYDCinfo
                    for (var i=0; i<16; i++) {
                        writeByte(std_dc_luminance_nrcodes[i+1]);
                    }
                    for (var j=0; j<=11; j++) {
                        writeByte(std_dc_luminance_values[j]);
                    }
    
                    writeByte(0x10); // HTYACinfo
                    for (var k=0; k<16; k++) {
                        writeByte(std_ac_luminance_nrcodes[k+1]);
                    }
                    for (var l=0; l<=161; l++) {
                        writeByte(std_ac_luminance_values[l]);
                    }
    
                    writeByte(1); // HTUDCinfo
                    for (var m=0; m<16; m++) {
                        writeByte(std_dc_chrominance_nrcodes[m+1]);
                    }
                    for (var n=0; n<=11; n++) {
                        writeByte(std_dc_chrominance_values[n]);
                    }
    
                    writeByte(0x11); // HTUACinfo
                    for (var o=0; o<16; o++) {
                        writeByte(std_ac_chrominance_nrcodes[o+1]);
                    }
                    for (var p=0; p<=161; p++) {
                        writeByte(std_ac_chrominance_values[p]);
                    }
                }
    
                function writeSOS()
                {
                    writeWord(0xFFDA); // marker
                    writeWord(12); // length
                    writeByte(3); // nrofcomponents
                    writeByte(1); // IdY
                    writeByte(0); // HTY
                    writeByte(2); // IdU
                    writeByte(0x11); // HTU
                    writeByte(3); // IdV
                    writeByte(0x11); // HTV
                    writeByte(0); // Ss
                    writeByte(0x3f); // Se
                    writeByte(0); // Bf
                }
    
                function processDU(CDU, fdtbl, DC, HTDC, HTAC){
                    var EOB = HTAC[0x00];
                    var M16zeroes = HTAC[0xF0];
                    var pos;
                    var I16 = 16;
                    var I63 = 63;
                    var I64 = 64;
                    var DU_DCT = fDCTQuant(CDU, fdtbl);
                    //ZigZag reorder
                    for (var j=0;j<I64;++j) {
                        DU[ZigZag[j]]=DU_DCT[j];
                    }
                    var Diff = DU[0] - DC; DC = DU[0];
                    //Encode DC
                    if (Diff==0) {
                        writeBits(HTDC[0]); // Diff might be 0
                    } else {
                        pos = 32767+Diff;
                        writeBits(HTDC[category[pos]]);
                        writeBits(bitcode[pos]);
                    }
                    //Encode ACs
                    var end0pos = 63; // was const... which is crazy
                    for (; (end0pos>0)&&(DU[end0pos]==0); end0pos--) {};
                    //end0pos = first element in reverse order !=0
                    if ( end0pos == 0) {
                        writeBits(EOB);
                        return DC;
                    }
                    var i = 1;
                    var lng;
                    while ( i <= end0pos ) {
                        var startpos = i;
                        for (; (DU[i]==0) && (i<=end0pos); ++i) {}
                        var nrzeroes = i-startpos;
                        if ( nrzeroes >= I16 ) {
                            lng = nrzeroes>>4;
                            for (var nrmarker=1; nrmarker <= lng; ++nrmarker)
                                writeBits(M16zeroes);
                            nrzeroes = nrzeroes&0xF;
                        }
                        pos = 32767+DU[i];
                        writeBits(HTAC[(nrzeroes<<4)+category[pos]]);
                        writeBits(bitcode[pos]);
                        i++;
                    }
                    if ( end0pos != I63 ) {
                        writeBits(EOB);
                    }
                    return DC;
                }
    
                function initCharLookupTable(){
                    var sfcc = String.fromCharCode;
                    for(var i=0; i < 256; i++){ ///// ACHTUNG // 255
                        clt[i] = sfcc(i);
                    }
                }
    
                this.encode = function(image,quality) // image data object
                {
                    // var time_start = new Date().getTime();
    
                    if(quality) setQuality(quality);
    
                    // Initialize bit writer
                    byteout = new Array();
                    bytenew=0;
                    bytepos=7;
    
                    // Add JPEG headers
                    writeWord(0xFFD8); // SOI
                    writeAPP0();
                    writeDQT();
                    writeSOF0(image.width,image.height);
                    writeDHT();
                    writeSOS();
    
    
                    // Encode 8x8 macroblocks
                    var DCY=0;
                    var DCU=0;
                    var DCV=0;
    
                    bytenew=0;
                    bytepos=7;
    
    
                    this.encode.displayName = "_encode_";
    
                    var imageData = image.data;
                    var width = image.width;
                    var height = image.height;
    
                    var quadWidth = width*4;
                    var tripleWidth = width*3;
    
                    var x, y = 0;
                    var r, g, b;
                    var start,p, col,row,pos;
                    while(y < height){
                        x = 0;
                        while(x < quadWidth){
                        start = quadWidth * y + x;
                        p = start;
                        col = -1;
                        row = 0;
    
                        for(pos=0; pos < 64; pos++){
                            row = pos >> 3;// /8
                            col = ( pos & 7 ) * 4; // %8
                            p = start + ( row * quadWidth ) + col;
    
                            if(y+row >= height){ // padding bottom
                                p-= (quadWidth*(y+1+row-height));
                            }
    
                            if(x+col >= quadWidth){ // padding right
                                p-= ((x+col) - quadWidth +4)
                            }
    
                            r = imageData[ p++ ];
                            g = imageData[ p++ ];
                            b = imageData[ p++ ];
    
    
                            /* // calculate YUV values dynamically
                            YDU[pos]=((( 0.29900)*r+( 0.58700)*g+( 0.11400)*b))-128; //-0x80
                            UDU[pos]=(((-0.16874)*r+(-0.33126)*g+( 0.50000)*b));
                            VDU[pos]=((( 0.50000)*r+(-0.41869)*g+(-0.08131)*b));
                            */
    
                            // use lookup table (slightly faster)
                            YDU[pos] = ((RGB_YUV_TABLE[r]             + RGB_YUV_TABLE[(g +  256)>>0] + RGB_YUV_TABLE[(b +  512)>>0]) >> 16)-128;
                            UDU[pos] = ((RGB_YUV_TABLE[(r +  768)>>0] + RGB_YUV_TABLE[(g + 1024)>>0] + RGB_YUV_TABLE[(b + 1280)>>0]) >> 16)-128;
                            VDU[pos] = ((RGB_YUV_TABLE[(r + 1280)>>0] + RGB_YUV_TABLE[(g + 1536)>>0] + RGB_YUV_TABLE[(b + 1792)>>0]) >> 16)-128;
    
                        }
    
                        DCY = processDU(YDU, fdtbl_Y, DCY, YDC_HT, YAC_HT);
                        DCU = processDU(UDU, fdtbl_UV, DCU, UVDC_HT, UVAC_HT);
                        DCV = processDU(VDU, fdtbl_UV, DCV, UVDC_HT, UVAC_HT);
                        x+=32;
                        }
                        y+=8;
                    }
    
    
                    ////////////////////////////////////////////////////////////////
    
                    // Do the bit alignment of the EOI marker
                    if ( bytepos >= 0 ) {
                        var fillbits = [];
                        fillbits[1] = bytepos+1;
                        fillbits[0] = (1<<(bytepos+1))-1;
                        writeBits(fillbits);
                    }
    
                    writeWord(0xFFD9); //EOI
    
                    var jpegDataUri = 'data:image/jpeg;base64,' + btoa(byteout.join(''));
    
                    byteout = [];
    
                    // benchmarking
                    // var duration = new Date().getTime() - time_start;
                    // console.log('Encoding time: '+ currentQuality + 'ms');
                    //
    
                    return jpegDataUri
            }
    
            function setQuality(quality){
                if (quality <= 0) {
                    quality = 1;
                }
                if (quality > 100) {
                    quality = 100;
                }
    
                if(currentQuality == quality) return // don't recalc if unchanged
    
                var sf = 0;
                if (quality < 50) {
                    sf = Math.floor(5000 / quality);
                } else {
                    sf = Math.floor(200 - quality*2);
                }
    
                initQuantTables(sf);
                currentQuality = quality;
                // console.log('Quality set to: '+quality +'%');
            }
    
            function init(){
                // var time_start = new Date().getTime();
                if(!quality) quality = 50;
                // Create tables
                initCharLookupTable()
                initHuffmanTbl();
                initCategoryNumber();
                initRGBYUVTable();
    
                setQuality(quality);
                // var duration = new Date().getTime() - time_start;
                // console.log('Initialization '+ duration + 'ms');
            }
    
            init();
    
        };
    
        JPEGEncoder.encode = function( data, quality ) {
            var encoder = new JPEGEncoder( quality );
    
            return encoder.encode( data );
        }
    
        return JPEGEncoder;
    });
    /**
     * @fileOverview Fix android canvas.toDataUrl bug.
     */
    define('runtime/html5/androidpatch',[
        'runtime/html5/util',
        'runtime/html5/jpegencoder',
        'base'
    ], function( Util, encoder, Base ) {
        var origin = Util.canvasToDataUrl,
            supportJpeg;
    
        Util.canvasToDataUrl = function( canvas, type, quality ) {
            var ctx, w, h, fragement, parts;
    
            // 非android手机直接跳过。
            if ( !Base.os.android ) {
                return origin.apply( null, arguments );
            }
    
            // 检测是否canvas支持jpeg导出，根据数据格式来判断。
            // JPEG 前两位分别是：255, 216
            if ( type === 'image/jpeg' && typeof supportJpeg === 'undefined' ) {
                fragement = origin.apply( null, arguments );
    
                parts = fragement.split(',');
    
                if ( ~parts[ 0 ].indexOf('base64') ) {
                    fragement = atob( parts[ 1 ] );
                } else {
                    fragement = decodeURIComponent( parts[ 1 ] );
                }
    
                fragement = fragement.substring( 0, 2 );
    
                supportJpeg = fragement.charCodeAt( 0 ) === 255 &&
                        fragement.charCodeAt( 1 ) === 216;
            }
    
            // 只有在android环境下才修复
            if ( type === 'image/jpeg' && !supportJpeg ) {
                w = canvas.width;
                h = canvas.height;
                ctx = canvas.getContext('2d');
    
                return encoder.encode( ctx.getImageData( 0, 0, w, h ), quality );
            }
    
            return origin.apply( null, arguments );
        };
    });
    /**
     * @fileOverview Image
     */
    define('runtime/html5/image',[
        'base',
        'runtime/html5/runtime',
        'runtime/html5/util'
    ], function( Base, Html5Runtime, Util ) {
    
        var BLANK = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D';
    
        return Html5Runtime.register( 'Image', {
    
            // flag: 标记是否被修改过。
            modified: false,
    
            init: function() {
                var me = this,
                    img = new Image();
    
                img.onload = function() {
    
                    me._info = {
                        type: me.type,
                        width: this.width,
                        height: this.height
                    };
    
                    //debugger;
    
                    // 读取meta信息。
                    if ( !me._metas && 'image/jpeg' === me.type ) {
                        Util.parseMeta( me._blob, function( error, ret ) {
                            me._metas = ret;
                            me.owner.trigger('load');
                        });
                    } else {
                        me.owner.trigger('load');
                    }
                };
    
                img.onerror = function() {
                    me.owner.trigger('error');
                };
    
                me._img = img;
            },
    
            loadFromBlob: function( blob ) {
                var me = this,
                    img = me._img;
    
                me._blob = blob;
                me.type = blob.type;
                img.src = Util.createObjectURL( blob.getSource() );
                me.owner.once( 'load', function() {
                    Util.revokeObjectURL( img.src );
                });
            },
    
            resize: function( width, height ) {
                var canvas = this._canvas ||
                        (this._canvas = document.createElement('canvas'));
    
                this._resize( this._img, canvas, width, height );
                this._blob = null;    // 没用了，可以删掉了。
                this.modified = true;
                this.owner.trigger( 'complete', 'resize' );
            },
    
            crop: function( x, y, w, h, s ) {
                var cvs = this._canvas ||
                        (this._canvas = document.createElement('canvas')),
                    opts = this.options,
                    img = this._img,
                    iw = img.naturalWidth,
                    ih = img.naturalHeight,
                    orientation = this.getOrientation();
    
                s = s || 1;
    
                // todo 解决 orientation 的问题。
                // values that require 90 degree rotation
                // if ( ~[ 5, 6, 7, 8 ].indexOf( orientation ) ) {
    
                //     switch ( orientation ) {
                //         case 6:
                //             tmp = x;
                //             x = y;
                //             y = iw * s - tmp - w;
                //             console.log(ih * s, tmp, w)
                //             break;
                //     }
    
                //     (w ^= h, h ^= w, w ^= h);
                // }
    
                cvs.width = w;
                cvs.height = h;
    
                opts.preserveHeaders || this._rotate2Orientaion( cvs, orientation );
                this._renderImageToCanvas( cvs, img, -x, -y, iw * s, ih * s );
    
                this._blob = null;    // 没用了，可以删掉了。
                this.modified = true;
                this.owner.trigger( 'complete', 'crop' );
            },
    
            getAsBlob: function( type ) {
                var blob = this._blob,
                    opts = this.options,
                    canvas;
    
                type = type || this.type;
    
                // blob需要重新生成。
                if ( this.modified || this.type !== type ) {
                    canvas = this._canvas;
    
                    if ( type === 'image/jpeg' ) {
    
                        blob = Util.canvasToDataUrl( canvas, type, opts.quality );
    
                        if ( opts.preserveHeaders && this._metas &&
                                this._metas.imageHead ) {
    
                            blob = Util.dataURL2ArrayBuffer( blob );
                            blob = Util.updateImageHead( blob,
                                    this._metas.imageHead );
                            blob = Util.arrayBufferToBlob( blob, type );
                            return blob;
                        }
                    } else {
                        blob = Util.canvasToDataUrl( canvas, type );
                    }
    
                    blob = Util.dataURL2Blob( blob );
                }
    
                return blob;
            },
    
            getAsDataUrl: function( type ) {
                var opts = this.options;
    
                type = type || this.type;
    
                if ( type === 'image/jpeg' ) {
                    return Util.canvasToDataUrl( this._canvas, type, opts.quality );
                } else {
                    return this._canvas.toDataURL( type );
                }
            },
    
            getOrientation: function() {
                return this._metas && this._metas.exif &&
                        this._metas.exif.get('Orientation') || 1;
            },
    
            info: function( val ) {
    
                // setter
                if ( val ) {
                    this._info = val;
                    return this;
                }
    
                // getter
                return this._info;
            },
    
            meta: function( val ) {
    
                // setter
                if ( val ) {
                    this._metas = val;
                    return this;
                }
    
                // getter
                return this._metas;
            },
    
            destroy: function() {
                var canvas = this._canvas;
                this._img.onload = null;
    
                if ( canvas ) {
                    canvas.getContext('2d')
                            .clearRect( 0, 0, canvas.width, canvas.height );
                    canvas.width = canvas.height = 0;
                    this._canvas = null;
                }
    
                // 释放内存。非常重要，否则释放不了image的内存。
                this._img.src = BLANK;
                this._img = this._blob = null;
            },
    
            _resize: function( img, cvs, width, height ) {
                var opts = this.options,
                    naturalWidth = img.width,
                    naturalHeight = img.height,
                    orientation = this.getOrientation(),
                    scale, w, h, x, y;
    
                // values that require 90 degree rotation
                if ( ~[ 5, 6, 7, 8 ].indexOf( orientation ) ) {
    
                    // 交换width, height的值。
                    width ^= height;
                    height ^= width;
                    width ^= height;
                }
    
                scale = Math[ opts.crop ? 'max' : 'min' ]( width / naturalWidth,
                        height / naturalHeight );
    
                // 不允许放大。
                opts.allowMagnify || (scale = Math.min( 1, scale ));
    
                w = naturalWidth * scale;
                h = naturalHeight * scale;
    
                if ( opts.crop ) {
                    cvs.width = width;
                    cvs.height = height;
                } else {
                    cvs.width = w;
                    cvs.height = h;
                }
    
                x = (cvs.width - w) / 2;
                y = (cvs.height - h) / 2;
    
                opts.preserveHeaders || this._rotate2Orientaion( cvs, orientation );
    
                this._renderImageToCanvas( cvs, img, x, y, w, h );
            },
    
            _rotate2Orientaion: function( canvas, orientation ) {
                var width = canvas.width,
                    height = canvas.height,
                    ctx = canvas.getContext('2d');
    
                switch ( orientation ) {
                    case 5:
                    case 6:
                    case 7:
                    case 8:
                        canvas.width = height;
                        canvas.height = width;
                        break;
                }
    
                switch ( orientation ) {
                    case 2:    // horizontal flip
                        ctx.translate( width, 0 );
                        ctx.scale( -1, 1 );
                        break;
    
                    case 3:    // 180 rotate left
                        ctx.translate( width, height );
                        ctx.rotate( Math.PI );
                        break;
    
                    case 4:    // vertical flip
                        ctx.translate( 0, height );
                        ctx.scale( 1, -1 );
                        break;
    
                    case 5:    // vertical flip + 90 rotate right
                        ctx.rotate( 0.5 * Math.PI );
                        ctx.scale( 1, -1 );
                        break;
    
                    case 6:    // 90 rotate right
                        ctx.rotate( 0.5 * Math.PI );
                        ctx.translate( 0, -height );
                        break;
    
                    case 7:    // horizontal flip + 90 rotate right
                        ctx.rotate( 0.5 * Math.PI );
                        ctx.translate( width, -height );
                        ctx.scale( -1, 1 );
                        break;
    
                    case 8:    // 90 rotate left
                        ctx.rotate( -0.5 * Math.PI );
                        ctx.translate( -width, 0 );
                        break;
                }
            },
    
            // https://github.com/stomita/ios-imagefile-megapixel/
            // blob/master/src/megapix-image.js
            _renderImageToCanvas: (function() {
    
                // 如果不是ios, 不需要这么复杂！
                if ( !Base.os.ios ) {
                    return function( canvas ) {
                        var args = Base.slice( arguments, 1 ),
                            ctx = canvas.getContext('2d');
    
                        ctx.drawImage.apply( ctx, args );
                    };
                }
    
                /**
                 * Detecting vertical squash in loaded image.
                 * Fixes a bug which squash image vertically while drawing into
                 * canvas for some images.
                 */
                function detectVerticalSquash( img, iw, ih ) {
                    var canvas = document.createElement('canvas'),
                        ctx = canvas.getContext('2d'),
                        sy = 0,
                        ey = ih,
                        py = ih,
                        data, alpha, ratio;
    
    
                    canvas.width = 1;
                    canvas.height = ih;
                    ctx.drawImage( img, 0, 0 );
                    data = ctx.getImageData( 0, 0, 1, ih ).data;
    
                    // search image edge pixel position in case
                    // it is squashed vertically.
                    while ( py > sy ) {
                        alpha = data[ (py - 1) * 4 + 3 ];
    
                        if ( alpha === 0 ) {
                            ey = py;
                        } else {
                            sy = py;
                        }
    
                        py = (ey + sy) >> 1;
                    }
    
                    ratio = (py / ih);
                    return (ratio === 0) ? 1 : ratio;
                }
    
                // fix ie7 bug
                // http://stackoverflow.com/questions/11929099/
                // html5-canvas-drawimage-ratio-bug-ios
                if ( Base.os.ios >= 7 ) {
                    return function( canvas, img, x, y, w, h ) {
                        var iw = img.naturalWidth,
                            ih = img.naturalHeight,
                            vertSquashRatio = detectVerticalSquash( img, iw, ih );
    
                        return canvas.getContext('2d').drawImage( img, 0, 0,
                                iw * vertSquashRatio, ih * vertSquashRatio,
                                x, y, w, h );
                    };
                }
    
                /**
                 * Detect subsampling in loaded image.
                 * In iOS, larger images than 2M pixels may be
                 * subsampled in rendering.
                 */
                function detectSubsampling( img ) {
                    var iw = img.naturalWidth,
                        ih = img.naturalHeight,
                        canvas, ctx;
    
                    // subsampling may happen overmegapixel image
                    if ( iw * ih > 1024 * 1024 ) {
                        canvas = document.createElement('canvas');
                        canvas.width = canvas.height = 1;
                        ctx = canvas.getContext('2d');
                        ctx.drawImage( img, -iw + 1, 0 );
    
                        // subsampled image becomes half smaller in rendering size.
                        // check alpha channel value to confirm image is covering
                        // edge pixel or not. if alpha value is 0
                        // image is not covering, hence subsampled.
                        return ctx.getImageData( 0, 0, 1, 1 ).data[ 3 ] === 0;
                    } else {
                        return false;
                    }
                }
    
    
                return function( canvas, img, x, y, width, height ) {
                    var iw = img.naturalWidth,
                        ih = img.naturalHeight,
                        ctx = canvas.getContext('2d'),
                        subsampled = detectSubsampling( img ),
                        doSquash = this.type === 'image/jpeg',
                        d = 1024,
                        sy = 0,
                        dy = 0,
                        tmpCanvas, tmpCtx, vertSquashRatio, dw, dh, sx, dx;
    
                    if ( subsampled ) {
                        iw /= 2;
                        ih /= 2;
                    }
    
                    ctx.save();
                    tmpCanvas = document.createElement('canvas');
                    tmpCanvas.width = tmpCanvas.height = d;
    
                    tmpCtx = tmpCanvas.getContext('2d');
                    vertSquashRatio = doSquash ?
                            detectVerticalSquash( img, iw, ih ) : 1;
    
                    dw = Math.ceil( d * width / iw );
                    dh = Math.ceil( d * height / ih / vertSquashRatio );
    
                    while ( sy < ih ) {
                        sx = 0;
                        dx = 0;
                        while ( sx < iw ) {
                            tmpCtx.clearRect( 0, 0, d, d );
                            tmpCtx.drawImage( img, -sx, -sy );
                            ctx.drawImage( tmpCanvas, 0, 0, d, d,
                                    x + dx, y + dy, dw, dh );
                            sx += d;
                            dx += dw;
                        }
                        sy += d;
                        dy += dh;
                    }
                    ctx.restore();
                    tmpCanvas = tmpCtx = null;
                };
            })()
        });
    });
    
    /**
     * @fileOverview Transport
     * @todo 支持chunked传输，优势：
     * 可以将大文件分成小块，挨个传输，可以提高大文件成功率，当失败的时候，也只需要重传那小部分，
     * 而不需要重头再传一次。另外断点续传也需要用chunked方式。
     */
    define('runtime/html5/transport',[
        'base',
        'runtime/html5/runtime'
    ], function( Base, Html5Runtime ) {
    
        var noop = Base.noop,
            $ = Base.$;
    
        return Html5Runtime.register( 'Transport', {
            init: function() {
                this._status = 0;
                this._response = null;
            },
    
            send: function() {
                var owner = this.owner,
                    opts = this.options,
                    xhr = this._initAjax(),
                    blob = owner._blob,
                    server = opts.server,
                    formData, binary, fr;
    
                if ( opts.sendAsBinary ) {
                    server += opts.attachInfoToQuery !== false ? ((/\?/.test( server ) ? '&' : '?') +
                            $.param( owner._formData )) : '';
    
                    binary = blob.getSource();
                } else {
                    formData = new FormData();
                    $.each( owner._formData, function( k, v ) {
                        formData.append( k, v );
                    });
    
                    formData.append( opts.fileVal, blob.getSource(),
                            opts.filename || owner._formData.name || '' );
                }
    
                if ( opts.withCredentials && 'withCredentials' in xhr ) {
                    xhr.open( opts.method, server, true );
                    xhr.withCredentials = true;
                } else {
                    xhr.open( opts.method, server );
                }
    
                this._setRequestHeader( xhr, opts.headers );
    
                if ( binary ) {
                    // 强制设置成 content-type 为文件流。
                    xhr.overrideMimeType &&
                            xhr.overrideMimeType('application/octet-stream');
    
                    // android直接发送blob会导致服务端接收到的是空文件。
                    // bug详情。
                    // https://code.google.com/p/android/issues/detail?id=39882
                    // 所以先用fileReader读取出来再通过arraybuffer的方式发送。
                    if ( Base.os.android ) {
                        fr = new FileReader();
    
                        fr.onload = function() {
                            xhr.send( this.result );
                            fr = fr.onload = null;
                        };
    
                        fr.readAsArrayBuffer( binary );
                    } else {
                        xhr.send( binary );
                    }
                } else {
                    xhr.send( formData );
                }
            },
    
            getResponse: function() {
                return this._response;
            },
    
            getResponseAsJson: function() {
                return this._parseJson( this._response );
            },
    
            getResponseHeaders: function() {
                return this._headers;
            },
    
            getStatus: function() {
                return this._status;
            },
    
            abort: function() {
                var xhr = this._xhr;
    
                if ( xhr ) {
                    xhr.upload.onprogress = noop;
                    xhr.onreadystatechange = noop;
                    xhr.abort();
    
                    this._xhr = xhr = null;
                }
            },
    
            destroy: function() {
                this.abort();
            },
    
            _parseHeader: function(raw) {
                var ret = {};
    
                raw && raw.replace(/^([^\:]+):(.*)$/mg, function(_, key, value) {
                    ret[key.trim()] = value.trim();
                });
    
                return ret;
            },
    
            _initAjax: function() {
                var me = this,
                    xhr = new XMLHttpRequest(),
                    opts = this.options;
    
                if ( opts.withCredentials && !('withCredentials' in xhr) &&
                        typeof XDomainRequest !== 'undefined' ) {
                    xhr = new XDomainRequest();
                }
    
                xhr.upload.onprogress = function( e ) {
                    var percentage = 0;
    
                    if ( e.lengthComputable ) {
                        percentage = e.loaded / e.total;
                    }
    
                    return me.trigger( 'progress', percentage );
                };
    
                xhr.onreadystatechange = function() {
    
                    if ( xhr.readyState !== 4 ) {
                        return;
                    }
    
                    xhr.upload.onprogress = noop;
                    xhr.onreadystatechange = noop;
                    me._xhr = null;
                    me._status = xhr.status;
    
                    var separator = '|', // 分隔符
                         // 拼接的状态，在 widgets/upload.js 会有代码用到这个分隔符
                        status = separator + xhr.status +
                                 separator + xhr.statusText;
    
                    if ( xhr.status >= 200 && xhr.status < 300 ) {
                        me._response = xhr.responseText;
                        me._headers = me._parseHeader(xhr.getAllResponseHeaders());
                        return me.trigger('load');
                    } else if ( xhr.status >= 500 && xhr.status < 600 ) {
                        me._response = xhr.responseText;
                        me._headers = me._parseHeader(xhr.getAllResponseHeaders());
                        return me.trigger( 'error', 'server' + status );
                    }
    
    
                    return me.trigger( 'error', me._status ? 'http' + status : 'abort' );
                };
    
                me._xhr = xhr;
                return xhr;
            },
    
            _setRequestHeader: function( xhr, headers ) {
                $.each( headers, function( key, val ) {
                    xhr.setRequestHeader( key, val );
                });
            },
    
            _parseJson: function( str ) {
                var json;
    
                try {
                    json = JSON.parse( str );
                } catch ( ex ) {
                    json = {};
                }
    
                return json;
            }
        });
    });
    
    /**
     * @fileOverview  Transport flash实现
     */
    define('runtime/html5/md5',[
        'runtime/html5/runtime'
    ], function( FlashRuntime ) {
    
        /*
         * Fastest md5 implementation around (JKM md5)
         * Credits: Joseph Myers
         *
         * @see http://www.myersdaily.org/joseph/javascript/md5-text.html
         * @see http://jsperf.com/md5-shootout/7
         */
    
        /* this function is much faster,
          so if possible we use it. Some IEs
          are the only ones I know of that
          need the idiotic second function,
          generated by an if clause.  */
        var add32 = function (a, b) {
            return (a + b) & 0xFFFFFFFF;
        },
    
        cmn = function (q, a, b, x, s, t) {
            a = add32(add32(a, q), add32(x, t));
            return add32((a << s) | (a >>> (32 - s)), b);
        },
    
        ff = function (a, b, c, d, x, s, t) {
            return cmn((b & c) | ((~b) & d), a, b, x, s, t);
        },
    
        gg = function (a, b, c, d, x, s, t) {
            return cmn((b & d) | (c & (~d)), a, b, x, s, t);
        },
    
        hh = function (a, b, c, d, x, s, t) {
            return cmn(b ^ c ^ d, a, b, x, s, t);
        },
    
        ii = function (a, b, c, d, x, s, t) {
            return cmn(c ^ (b | (~d)), a, b, x, s, t);
        },
    
        md5cycle = function (x, k) {
            var a = x[0],
                b = x[1],
                c = x[2],
                d = x[3];
    
            a = ff(a, b, c, d, k[0], 7, -680876936);
            d = ff(d, a, b, c, k[1], 12, -389564586);
            c = ff(c, d, a, b, k[2], 17, 606105819);
            b = ff(b, c, d, a, k[3], 22, -1044525330);
            a = ff(a, b, c, d, k[4], 7, -176418897);
            d = ff(d, a, b, c, k[5], 12, 1200080426);
            c = ff(c, d, a, b, k[6], 17, -1473231341);
            b = ff(b, c, d, a, k[7], 22, -45705983);
            a = ff(a, b, c, d, k[8], 7, 1770035416);
            d = ff(d, a, b, c, k[9], 12, -1958414417);
            c = ff(c, d, a, b, k[10], 17, -42063);
            b = ff(b, c, d, a, k[11], 22, -1990404162);
            a = ff(a, b, c, d, k[12], 7, 1804603682);
            d = ff(d, a, b, c, k[13], 12, -40341101);
            c = ff(c, d, a, b, k[14], 17, -1502002290);
            b = ff(b, c, d, a, k[15], 22, 1236535329);
    
            a = gg(a, b, c, d, k[1], 5, -165796510);
            d = gg(d, a, b, c, k[6], 9, -1069501632);
            c = gg(c, d, a, b, k[11], 14, 643717713);
            b = gg(b, c, d, a, k[0], 20, -373897302);
            a = gg(a, b, c, d, k[5], 5, -701558691);
            d = gg(d, a, b, c, k[10], 9, 38016083);
            c = gg(c, d, a, b, k[15], 14, -660478335);
            b = gg(b, c, d, a, k[4], 20, -405537848);
            a = gg(a, b, c, d, k[9], 5, 568446438);
            d = gg(d, a, b, c, k[14], 9, -1019803690);
            c = gg(c, d, a, b, k[3], 14, -187363961);
            b = gg(b, c, d, a, k[8], 20, 1163531501);
            a = gg(a, b, c, d, k[13], 5, -1444681467);
            d = gg(d, a, b, c, k[2], 9, -51403784);
            c = gg(c, d, a, b, k[7], 14, 1735328473);
            b = gg(b, c, d, a, k[12], 20, -1926607734);
    
            a = hh(a, b, c, d, k[5], 4, -378558);
            d = hh(d, a, b, c, k[8], 11, -2022574463);
            c = hh(c, d, a, b, k[11], 16, 1839030562);
            b = hh(b, c, d, a, k[14], 23, -35309556);
            a = hh(a, b, c, d, k[1], 4, -1530992060);
            d = hh(d, a, b, c, k[4], 11, 1272893353);
            c = hh(c, d, a, b, k[7], 16, -155497632);
            b = hh(b, c, d, a, k[10], 23, -1094730640);
            a = hh(a, b, c, d, k[13], 4, 681279174);
            d = hh(d, a, b, c, k[0], 11, -358537222);
            c = hh(c, d, a, b, k[3], 16, -722521979);
            b = hh(b, c, d, a, k[6], 23, 76029189);
            a = hh(a, b, c, d, k[9], 4, -640364487);
            d = hh(d, a, b, c, k[12], 11, -421815835);
            c = hh(c, d, a, b, k[15], 16, 530742520);
            b = hh(b, c, d, a, k[2], 23, -995338651);
    
            a = ii(a, b, c, d, k[0], 6, -198630844);
            d = ii(d, a, b, c, k[7], 10, 1126891415);
            c = ii(c, d, a, b, k[14], 15, -1416354905);
            b = ii(b, c, d, a, k[5], 21, -57434055);
            a = ii(a, b, c, d, k[12], 6, 1700485571);
            d = ii(d, a, b, c, k[3], 10, -1894986606);
            c = ii(c, d, a, b, k[10], 15, -1051523);
            b = ii(b, c, d, a, k[1], 21, -2054922799);
            a = ii(a, b, c, d, k[8], 6, 1873313359);
            d = ii(d, a, b, c, k[15], 10, -30611744);
            c = ii(c, d, a, b, k[6], 15, -1560198380);
            b = ii(b, c, d, a, k[13], 21, 1309151649);
            a = ii(a, b, c, d, k[4], 6, -145523070);
            d = ii(d, a, b, c, k[11], 10, -1120210379);
            c = ii(c, d, a, b, k[2], 15, 718787259);
            b = ii(b, c, d, a, k[9], 21, -343485551);
    
            x[0] = add32(a, x[0]);
            x[1] = add32(b, x[1]);
            x[2] = add32(c, x[2]);
            x[3] = add32(d, x[3]);
        },
    
        /* there needs to be support for Unicode here,
           * unless we pretend that we can redefine the MD-5
           * algorithm for multi-byte characters (perhaps
           * by adding every four 16-bit characters and
           * shortening the sum to 32 bits). Otherwise
           * I suggest performing MD-5 as if every character
           * was two bytes--e.g., 0040 0025 = @%--but then
           * how will an ordinary MD-5 sum be matched?
           * There is no way to standardize text to something
           * like UTF-8 before transformation; speed cost is
           * utterly prohibitive. The JavaScript standard
           * itself needs to look at this: it should start
           * providing access to strings as preformed UTF-8
           * 8-bit unsigned value arrays.
           */
        md5blk = function (s) {
            var md5blks = [],
                i; /* Andy King said do it this way. */
    
            for (i = 0; i < 64; i += 4) {
                md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
            }
            return md5blks;
        },
    
        md5blk_array = function (a) {
            var md5blks = [],
                i; /* Andy King said do it this way. */
    
            for (i = 0; i < 64; i += 4) {
                md5blks[i >> 2] = a[i] + (a[i + 1] << 8) + (a[i + 2] << 16) + (a[i + 3] << 24);
            }
            return md5blks;
        },
    
        md51 = function (s) {
            var n = s.length,
                state = [1732584193, -271733879, -1732584194, 271733878],
                i,
                length,
                tail,
                tmp,
                lo,
                hi;
    
            for (i = 64; i <= n; i += 64) {
                md5cycle(state, md5blk(s.substring(i - 64, i)));
            }
            s = s.substring(i - 64);
            length = s.length;
            tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            for (i = 0; i < length; i += 1) {
                tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
            }
            tail[i >> 2] |= 0x80 << ((i % 4) << 3);
            if (i > 55) {
                md5cycle(state, tail);
                for (i = 0; i < 16; i += 1) {
                    tail[i] = 0;
                }
            }
    
            // Beware that the final length might not fit in 32 bits so we take care of that
            tmp = n * 8;
            tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
            lo = parseInt(tmp[2], 16);
            hi = parseInt(tmp[1], 16) || 0;
    
            tail[14] = lo;
            tail[15] = hi;
    
            md5cycle(state, tail);
            return state;
        },
    
        md51_array = function (a) {
            var n = a.length,
                state = [1732584193, -271733879, -1732584194, 271733878],
                i,
                length,
                tail,
                tmp,
                lo,
                hi;
    
            for (i = 64; i <= n; i += 64) {
                md5cycle(state, md5blk_array(a.subarray(i - 64, i)));
            }
    
            // Not sure if it is a bug, however IE10 will always produce a sub array of length 1
            // containing the last element of the parent array if the sub array specified starts
            // beyond the length of the parent array - weird.
            // https://connect.microsoft.com/IE/feedback/details/771452/typed-array-subarray-issue
            a = (i - 64) < n ? a.subarray(i - 64) : new Uint8Array(0);
    
            length = a.length;
            tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            for (i = 0; i < length; i += 1) {
                tail[i >> 2] |= a[i] << ((i % 4) << 3);
            }
    
            tail[i >> 2] |= 0x80 << ((i % 4) << 3);
            if (i > 55) {
                md5cycle(state, tail);
                for (i = 0; i < 16; i += 1) {
                    tail[i] = 0;
                }
            }
    
            // Beware that the final length might not fit in 32 bits so we take care of that
            tmp = n * 8;
            tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
            lo = parseInt(tmp[2], 16);
            hi = parseInt(tmp[1], 16) || 0;
    
            tail[14] = lo;
            tail[15] = hi;
    
            md5cycle(state, tail);
    
            return state;
        },
    
        hex_chr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'],
    
        rhex = function (n) {
            var s = '',
                j;
            for (j = 0; j < 4; j += 1) {
                s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
            }
            return s;
        },
    
        hex = function (x) {
            var i;
            for (i = 0; i < x.length; i += 1) {
                x[i] = rhex(x[i]);
            }
            return x.join('');
        },
    
        md5 = function (s) {
            return hex(md51(s));
        },
    
    
    
        ////////////////////////////////////////////////////////////////////////////
    
        /**
         * SparkMD5 OOP implementation.
         *
         * Use this class to perform an incremental md5, otherwise use the
         * static methods instead.
         */
        SparkMD5 = function () {
            // call reset to init the instance
            this.reset();
        };
    
    
        // In some cases the fast add32 function cannot be used..
        if (md5('hello') !== '5d41402abc4b2a76b9719d911017c592') {
            add32 = function (x, y) {
                var lsw = (x & 0xFFFF) + (y & 0xFFFF),
                    msw = (x >> 16) + (y >> 16) + (lsw >> 16);
                return (msw << 16) | (lsw & 0xFFFF);
            };
        }
    
    
        /**
         * Appends a string.
         * A conversion will be applied if an utf8 string is detected.
         *
         * @param {String} str The string to be appended
         *
         * @return {SparkMD5} The instance itself
         */
        SparkMD5.prototype.append = function (str) {
            // converts the string to utf8 bytes if necessary
            if (/[\u0080-\uFFFF]/.test(str)) {
                str = unescape(encodeURIComponent(str));
            }
    
            // then append as binary
            this.appendBinary(str);
    
            return this;
        };
    
        /**
         * Appends a binary string.
         *
         * @param {String} contents The binary string to be appended
         *
         * @return {SparkMD5} The instance itself
         */
        SparkMD5.prototype.appendBinary = function (contents) {
            this._buff += contents;
            this._length += contents.length;
    
            var length = this._buff.length,
                i;
    
            for (i = 64; i <= length; i += 64) {
                md5cycle(this._state, md5blk(this._buff.substring(i - 64, i)));
            }
    
            this._buff = this._buff.substr(i - 64);
    
            return this;
        };
    
        /**
         * Finishes the incremental computation, reseting the internal state and
         * returning the result.
         * Use the raw parameter to obtain the raw result instead of the hex one.
         *
         * @param {Boolean} raw True to get the raw result, false to get the hex result
         *
         * @return {String|Array} The result
         */
        SparkMD5.prototype.end = function (raw) {
            var buff = this._buff,
                length = buff.length,
                i,
                tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                ret;
    
            for (i = 0; i < length; i += 1) {
                tail[i >> 2] |= buff.charCodeAt(i) << ((i % 4) << 3);
            }
    
            this._finish(tail, length);
            ret = !!raw ? this._state : hex(this._state);
    
            this.reset();
    
            return ret;
        };
    
        /**
         * Finish the final calculation based on the tail.
         *
         * @param {Array}  tail   The tail (will be modified)
         * @param {Number} length The length of the remaining buffer
         */
        SparkMD5.prototype._finish = function (tail, length) {
            var i = length,
                tmp,
                lo,
                hi;
    
            tail[i >> 2] |= 0x80 << ((i % 4) << 3);
            if (i > 55) {
                md5cycle(this._state, tail);
                for (i = 0; i < 16; i += 1) {
                    tail[i] = 0;
                }
            }
    
            // Do the final computation based on the tail and length
            // Beware that the final length may not fit in 32 bits so we take care of that
            tmp = this._length * 8;
            tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
            lo = parseInt(tmp[2], 16);
            hi = parseInt(tmp[1], 16) || 0;
    
            tail[14] = lo;
            tail[15] = hi;
            md5cycle(this._state, tail);
        };
    
        /**
         * Resets the internal state of the computation.
         *
         * @return {SparkMD5} The instance itself
         */
        SparkMD5.prototype.reset = function () {
            this._buff = "";
            this._length = 0;
            this._state = [1732584193, -271733879, -1732584194, 271733878];
    
            return this;
        };
    
        /**
         * Releases memory used by the incremental buffer and other aditional
         * resources. If you plan to use the instance again, use reset instead.
         */
        SparkMD5.prototype.destroy = function () {
            delete this._state;
            delete this._buff;
            delete this._length;
        };
    
    
        /**
         * Performs the md5 hash on a string.
         * A conversion will be applied if utf8 string is detected.
         *
         * @param {String}  str The string
         * @param {Boolean} raw True to get the raw result, false to get the hex result
         *
         * @return {String|Array} The result
         */
        SparkMD5.hash = function (str, raw) {
            // converts the string to utf8 bytes if necessary
            if (/[\u0080-\uFFFF]/.test(str)) {
                str = unescape(encodeURIComponent(str));
            }
    
            var hash = md51(str);
    
            return !!raw ? hash : hex(hash);
        };
    
        /**
         * Performs the md5 hash on a binary string.
         *
         * @param {String}  content The binary string
         * @param {Boolean} raw     True to get the raw result, false to get the hex result
         *
         * @return {String|Array} The result
         */
        SparkMD5.hashBinary = function (content, raw) {
            var hash = md51(content);
    
            return !!raw ? hash : hex(hash);
        };
    
        /**
         * SparkMD5 OOP implementation for array buffers.
         *
         * Use this class to perform an incremental md5 ONLY for array buffers.
         */
        SparkMD5.ArrayBuffer = function () {
            // call reset to init the instance
            this.reset();
        };
    
        ////////////////////////////////////////////////////////////////////////////
    
        /**
         * Appends an array buffer.
         *
         * @param {ArrayBuffer} arr The array to be appended
         *
         * @return {SparkMD5.ArrayBuffer} The instance itself
         */
        SparkMD5.ArrayBuffer.prototype.append = function (arr) {
            // TODO: we could avoid the concatenation here but the algorithm would be more complex
            //       if you find yourself needing extra performance, please make a PR.
            var buff = this._concatArrayBuffer(this._buff, arr),
                length = buff.length,
                i;
    
            this._length += arr.byteLength;
    
            for (i = 64; i <= length; i += 64) {
                md5cycle(this._state, md5blk_array(buff.subarray(i - 64, i)));
            }
    
            // Avoids IE10 weirdness (documented above)
            this._buff = (i - 64) < length ? buff.subarray(i - 64) : new Uint8Array(0);
    
            return this;
        };
    
        /**
         * Finishes the incremental computation, reseting the internal state and
         * returning the result.
         * Use the raw parameter to obtain the raw result instead of the hex one.
         *
         * @param {Boolean} raw True to get the raw result, false to get the hex result
         *
         * @return {String|Array} The result
         */
        SparkMD5.ArrayBuffer.prototype.end = function (raw) {
            var buff = this._buff,
                length = buff.length,
                tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                i,
                ret;
    
            for (i = 0; i < length; i += 1) {
                tail[i >> 2] |= buff[i] << ((i % 4) << 3);
            }
    
            this._finish(tail, length);
            ret = !!raw ? this._state : hex(this._state);
    
            this.reset();
    
            return ret;
        };
    
        SparkMD5.ArrayBuffer.prototype._finish = SparkMD5.prototype._finish;
    
        /**
         * Resets the internal state of the computation.
         *
         * @return {SparkMD5.ArrayBuffer} The instance itself
         */
        SparkMD5.ArrayBuffer.prototype.reset = function () {
            this._buff = new Uint8Array(0);
            this._length = 0;
            this._state = [1732584193, -271733879, -1732584194, 271733878];
    
            return this;
        };
    
        /**
         * Releases memory used by the incremental buffer and other aditional
         * resources. If you plan to use the instance again, use reset instead.
         */
        SparkMD5.ArrayBuffer.prototype.destroy = SparkMD5.prototype.destroy;
    
        /**
         * Concats two array buffers, returning a new one.
         *
         * @param  {ArrayBuffer} first  The first array buffer
         * @param  {ArrayBuffer} second The second array buffer
         *
         * @return {ArrayBuffer} The new array buffer
         */
        SparkMD5.ArrayBuffer.prototype._concatArrayBuffer = function (first, second) {
            var firstLength = first.length,
                result = new Uint8Array(firstLength + second.byteLength);
    
            result.set(first);
            result.set(new Uint8Array(second), firstLength);
    
            return result;
        };
    
        /**
         * Performs the md5 hash on an array buffer.
         *
         * @param {ArrayBuffer} arr The array buffer
         * @param {Boolean}     raw True to get the raw result, false to get the hex result
         *
         * @return {String|Array} The result
         */
        SparkMD5.ArrayBuffer.hash = function (arr, raw) {
            var hash = md51_array(new Uint8Array(arr));
    
            return !!raw ? hash : hex(hash);
        };
        
        return FlashRuntime.register( 'Md5', {
            init: function() {
                // do nothing.
            },
    
            loadFromBlob: function( file ) {
                var blob = file.getSource(),
                    chunkSize = 2 * 1024 * 1024,
                    chunks = Math.ceil( blob.size / chunkSize ),
                    chunk = 0,
                    owner = this.owner,
                    spark = new SparkMD5.ArrayBuffer(),
                    me = this,
                    blobSlice = blob.mozSlice || blob.webkitSlice || blob.slice,
                    loadNext, fr;
    
                fr = new FileReader();
    
                loadNext = function() {
                    var start, end;
    
                    start = chunk * chunkSize;
                    end = Math.min( start + chunkSize, blob.size );
    
                    fr.onload = function( e ) {
                        spark.append( e.target.result );
                        owner.trigger( 'progress', {
                            total: file.size,
                            loaded: end
                        });
                    };
    
                    fr.onloadend = function() {
                        fr.onloadend = fr.onload = null;
    
                        if ( ++chunk < chunks ) {
                            setTimeout( loadNext, 1 );
                        } else {
                            setTimeout(function(){
                                owner.trigger('load');
                                me.result = spark.end();
                                loadNext = file = blob = spark = null;
                                owner.trigger('complete');
                            }, 50 );
                        }
                    };
    
                    fr.readAsArrayBuffer( blobSlice.call( blob, start, end ) );
                };
    
                loadNext();
            },
    
            getResult: function() {
                return this.result;
            }
        });
    });
    /**
     * @fileOverview 完全版本。
     */
    define('preset/all',[
        'base',
    
        // widgets
        'widgets/filednd',
        'widgets/filepaste',
        'widgets/filepicker',
        'widgets/image',
        'widgets/queue',
        'widgets/runtime',
        'widgets/upload',
        'widgets/validator',
        'widgets/md5',
    
        // runtimes
        // html5
        'runtime/html5/blob',
        'runtime/html5/dnd',
        'runtime/html5/filepaste',
        'runtime/html5/filepicker',
        'runtime/html5/imagemeta/exif',
        'runtime/html5/androidpatch',
        'runtime/html5/image',
        'runtime/html5/transport',
        'runtime/html5/md5',
    
        // flash
        // 'runtime/flash/filepicker',
        // 'runtime/flash/image',
        // 'runtime/flash/transport',
        // 'runtime/flash/blob',
        // 'runtime/flash/md5'
    ], function( Base ) {
        return Base;
    });
    
    /**
     * @fileOverview 日志组件，主要用来收集错误信息，可以帮助 webuploader 更好的定位问题和发展。
     *
     * 如果您不想要启用此功能，请在打包的时候去掉 log 模块。
     *
     * 或者可以在初始化的时候通过 options.disableWidgets 属性禁用。
     *
     * 如：
     * WebUploader.create({
     *     ...
     *
     *     disableWidgets: 'log',
     *
     *     ...
     * })
     */
    define('widgets/log',[
        'base',
        'uploader',
        'widgets/widget'
    ], function( Base, Uploader ) {
        var $ = Base.$,
            logUrl = ' http://static.tieba.baidu.com/tb/pms/img/st.gif??',
            product = (location.hostname || location.host || 'protected').toLowerCase(),
    
            // 只针对 baidu 内部产品用户做统计功能。
            enable = product && /baidu/i.exec(product),
            base;
    
        if (!enable) {
            return;
        }
    
        base = {
            dv: 3,
            master: 'webuploader',
            online: /test/.exec(product) ? 0 : 1,
            module: '',
            product: product,
            type: 0
        };
    
        function send(data) {
            var obj = $.extend({}, base, data),
                url = logUrl.replace(/^(.*)\?/, '$1' + $.param( obj )),
                image = new Image();
    
            image.src = url;
        }
    
        return Uploader.register({
            name: 'log',
    
            init: function() {
                var owner = this.owner,
                    count = 0,
                    size = 0;
    
                owner
                    .on('error', function(code) {
                        send({
                            type: 2,
                            c_error_code: code
                        });
                    })
                    .on('uploadError', function(file, reason) {
                        send({
                            type: 2,
                            c_error_code: 'UPLOAD_ERROR',
                            c_reason: '' + reason
                        });
                    })
                    .on('uploadComplete', function(file) {
                        count++;
                        size += file.size;
                    }).
                    on('uploadFinished', function() {
                        send({
                            c_count: count,
                            c_size: size
                        });
                        count = size = 0;
                    });
    
                send({
                    c_usage: 1
                });
            }
        });
    });
    /**
     * @fileOverview Uploader上传类
     */
    define('webuploader',[
        'preset/all',
        'widgets/log'
    ], function( preset ) {
        return preset;
    });
    return require('webuploader');
});
