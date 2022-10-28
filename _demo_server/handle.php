<?php

$config = [
    // 上传图片配置项
    "imageActionName" => "image",
    "imageFieldName" => "file",
    "imageMaxSize" => 1024 * 1024 * 10,
    "imageAllowFiles" => ['.jpg', '.png', '.jpeg'],
    "imageCompressEnable" => true,
    "imageCompressBorder" => 5000,
    "imageInsertAlign" => "none",
    "imageUrlPrefix" => "",

    // 涂鸦图片上传配置项
    "scrawlActionName" => "crawl",
    "scrawlFieldName" => "file",
    "scrawlMaxSize" => 1024 * 1024 * 10,
    "scrawlUrlPrefix" => "",
    "scrawlInsertAlign" => "none",

    // 截图工具上传
    "snapscreenActionName" => "snap",
    "snapscreenUrlPrefix" => "",
    "snapscreenInsertAlign" => "none",

    // 抓取
    "catcherLocalDomain" => [
        "127.0.0.1",
        "localhost",
    ],
    "catcherActionName" => "catch",
    "catcherFieldName" => "source",
    "catcherUrlPrefix" => "",
    "catcherMaxSize" => 1024 * 1024 * 10,
    "catcherAllowFiles" => ['.jpg', '.png', '.jpeg'],

    // 上传视频配置
    "videoActionName" => "video",
    "videoFieldName" => "file",
    "videoUrlPrefix" => "",
    "videoMaxSize" => 1024 * 1024 * 100,
    "videoAllowFiles" => ['.mp4'],

    // 上传文件配置
    "fileActionName" => "file",
    "fileFieldName" => "file",
    "fileUrlPrefix" => "",
    "fileMaxSize" => 1024 * 1024 * 100,
    "fileAllowFiles" => ['.zip', '.pdf', '.doc'],

    // 列出图片
    "imageManagerActionName" => "listImage",
    "imageManagerListSize" => 20,
    "imageManagerUrlPrefix" => "",
    "imageManagerInsertAlign" => "none",
    "imageManagerAllowFiles" => ['.jpg', '.png', '.jpeg'],

    // 列出指定目录下的文件
    "fileManagerActionName" => "listFile",
    "fileManagerUrlPrefix" => "",
    "fileManagerListSize" => 20,
    "fileManagerAllowFiles" => ['.zip', '.pdf', '.doc'],

    // 公式渲染
    "formulaConfig" => [
        "imageUrlTemplate"=>"https://latex.codecogs.com/svg.image?{}",
    ]

];

function output($data)
{
    header('Content-Type: application/json');
    echo json_encode($data);
    exit();
}

$action = @$_GET['action'];
// var_dump($action);exit();
switch ($action) {
    case 'showPost':
        output($_POST);
        break;
    case 'image':
        // 图片文件上传
        // print_r($_FILES);
        // output(['state' => '上传错误信息']);
        sleep(2);
        $name = isset($_POST['name']) ? $_POST['name'] : '';
        output([
            'state' => 'SUCCESS',
            'url' => 'https://ms-assets.modstart.com/demo/modstart.jpg?name=' . urlencode($name),
        ]);
    case 'listImage':
        // 图片列表
        $list = [];
        for ($i = 0; $i < 20; $i++) {
            $list[] = [
                'url' => 'https://ms-assets.modstart.com/demo/modstart.jpg',
                'mtime' => time(),
            ];
        }
        $result = [
            "state" => "SUCCESS",
            "list" => $list,
            "start" => intval(@$_GET['start']),
            "total" => 100
        ];
        output($result);
    case 'video':
        // 上传视频
        // print_r($_FILES);
        // output(['state' => '上传错误信息']);
        output(['state' => 'SUCCESS', 'url' => 'https://ms-assets.modstart.com/demo/modstart.mp4']);
    case 'file':
        // 上传文件
        // print_r($_FILES);
        // output(['state' => '上传错误信息']);
        output(['state' => 'SUCCESS', 'url' => 'https://ms-assets.modstart.com/demo/modstart.jpg']);
    case 'listFile':
        // 文件列表
        $list = [];
        for ($i = 0; $i < 20; $i++) {
            $list[] = [
                'url' => 'https://ms-assets.modstart.com/demo/modstart.jpg',
                'mtime' => time(),
            ];
        }
        $result = [
            "state" => "SUCCESS",
            "list" => $list,
            "start" => intval(@$_GET['start']),
            "total" => 100
        ];
        output($result);
    case 'crawl':
        // 涂鸦上传
        // output(['state' => '上传错误信息']);
        output(['state' => 'SUCCESS', 'url' => 'https://ms-assets.modstart.com/demo/modstart.jpg']);
    case 'catch':
        // 图片抓取
        // output(['state' => '上传错误信息']);
        $list = [];
        $source = @$_POST['source'];
        if (!is_array($source) || empty($source)) {
            $source = [];
        }
        foreach ($source as $imgUrl) {
            $list[] = [
                'state' => 'SUCCESS',
                'url' => 'https://ms-assets.modstart.com/demo/modstart.jpg',
                'size' => 100,
                'title' => 'title',
                'original' => '',
                'source' => htmlspecialchars($imgUrl),
            ];
        }
        output(['state' => 'SUCCESS', 'list' => $list]);
    default:
        output($config);
}
