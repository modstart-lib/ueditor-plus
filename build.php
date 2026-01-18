<?php

$dir = '../open.demo.soft.host/public/ueditor-plus/_examples';
$cdnDomain = 'https://open-cdn.modstart.com/ueditor-plus/';

/**
 * 递归查找HTML文件并修改JS/CSS引用，添加版本号（文件MD5值）
 * @param string $directory 要扫描的目录
 * @param string $baseDir 基准目录（用于计算相对路径）
 */
function processHtmlFiles($directory, $baseDir)
{
    if (!is_dir($directory)) {
        echo "目录不存在: $directory\n";
        return;
    }

    $items = scandir($directory);

    foreach ($items as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }

        $path = $directory . DIRECTORY_SEPARATOR . $item;

        if (is_dir($path)) {
            // 递归处理子目录
            processHtmlFiles($path, $baseDir);
        } elseif (is_file($path) && strtolower(pathinfo($path, PATHINFO_EXTENSION)) === 'html') {
            // 处理HTML文件
            processHtmlFile($path, $baseDir);
        }
    }
}

/**
 * 处理单个HTML文件，修改其中的JS和CSS引用
 * @param string $htmlFile HTML文件路径
 * @param string $baseDir 基准目录（用于计算相对路径）
 */
function processHtmlFile($htmlFile, $baseDir)
{
    global $cdnDomain;
    $content = file_get_contents($htmlFile);
    if ($content === false) {
        echo "无法读取文件: $htmlFile\n";
        return;
    }

    $htmlDir = dirname($htmlFile);
    $modified = false;

    // 处理 <script src="..."> 标签
    $content = preg_replace_callback(
        '/<script([^>]*?)src=(["\'])((?!http:\/\/|https:\/\/|\/\/).+?)\2([^>]*?)>/i',
        function ($matches) use ($htmlDir, $cdnDomain, $baseDir, &$modified) {
            $relativePath = $matches[3];
            $fullPath = realpath($htmlDir . DIRECTORY_SEPARATOR . $relativePath);

            if ($fullPath && file_exists($fullPath)) {
                $md5 = substr(md5_file($fullPath), 0, 8);
                // 计算相对于baseDir父目录的路径
                $projectRoot = dirname($baseDir);
                if (strpos($fullPath, $projectRoot) === 0) {
                    $cdnPath = substr($fullPath, strlen($projectRoot) + 1);
                    $cdnPath = str_replace(DIRECTORY_SEPARATOR, '/', $cdnPath);
                    $newSrc = $cdnDomain . $cdnPath . '?v=' . $md5;
                    $modified = true;
                    echo "  替换: $relativePath -> $newSrc\n";
                    return '<script' . $matches[1] . 'src=' . $matches[2] . $newSrc . $matches[2] . $matches[4] . '>';
                }
            }
            return $matches[0];
        },
        $content
    );

    // 处理 <link href="..."> 标签（CSS文件）
    $content = preg_replace_callback(
        '/<link([^>]*?)href=(["\'])((?!http:\/\/|https:\/\/|\/\/).+?\.css)\2([^>]*?)>/i',
        function ($matches) use ($htmlDir, $cdnDomain, $baseDir, &$modified) {
            $relativePath = $matches[3];
            $fullPath = realpath($htmlDir . DIRECTORY_SEPARATOR . $relativePath);

            if ($fullPath && file_exists($fullPath)) {
                $md5 = md5_file($fullPath);
                // 计算相对于baseDir父目录的路径
                $projectRoot = dirname($baseDir);
                if (strpos($fullPath, $projectRoot) === 0) {
                    $cdnPath = substr($fullPath, strlen($projectRoot) + 1);
                    $cdnPath = str_replace(DIRECTORY_SEPARATOR, '/', $cdnPath);
                    $newHref = $cdnDomain . $cdnPath . '?v=' . $md5;
                    $modified = true;
                    echo "  替换: $relativePath -> $newHref\n";
                    return '<link' . $matches[1] . 'href=' . $matches[2] . $newHref . $matches[2] . $matches[4] . '>';
                }
            }
            return $matches[0];
        },
        $content
    );

    if ($modified) {
        file_put_contents($htmlFile, $content);
        echo "已更新: $htmlFile\n";
    }
}

// 执行处理
$projectRoot = __DIR__;
$targetDir = $projectRoot . DIRECTORY_SEPARATOR . $dir;
if (is_dir($targetDir)) {
    $baseDir = realpath($targetDir);
    echo "项目根目录: $projectRoot\n";
    echo "目标目录: $targetDir\n";
    echo "基准目录: $baseDir\n";
    processHtmlFiles($targetDir, $baseDir);
    echo "处理完成！\n";
} else {
    echo "目录不存在: $targetDir\n";
}
