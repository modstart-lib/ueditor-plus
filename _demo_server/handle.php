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
    "catcherLocalDomain" => ["127.0.0.1", "localhost"],
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
    "fileManagerAllowFiles" => ['.zip', '.pdf', '.doc']

];

function output($data)
{
    header('Content-Type: application/json');
    echo json_encode($data);
    exit();
}

$action = @$_GET['action'];
switch ($action) {
    default:
        output($config);
}
