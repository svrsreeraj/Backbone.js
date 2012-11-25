<?php

/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
ob_start();
session_start();
if ($_POST) {
    if ($_POST["_method"] == "PUT") {
        foreach ($_SESSION["userData"] as $key => $singleUser) {
            if ($singleUser["id"] == $_GET["id"]) {
                $_SESSION["userData"][$key] = (array) json_decode($_POST["model"]);
            }
        }
        return true;
        exit;
    } elseif ($_POST["_method"] == "DELETE") {
        foreach ($_SESSION["userData"] as $key => $singleUser) {
            if ($singleUser["id"] == $_GET["id"]) {
                unset($_SESSION["userData"][$key]);
            }
        }
        $tempArray = array();
        foreach ($_SESSION["userData"] as $key => $singleUser) {
            $tempArray[] = $singleUser;
        }
        $_SESSION["userData"] = $tempArray;
        return true;
        exit;
    } elseif ($_POST["model"]) {
        $newUser = (array) json_decode($_POST["model"]);
        $newUser["id"] = rand(1, 10000);
        $_SESSION["userData"][] = $newUser;
        $jsonData = json_encode($newUser);
    }
} else {
    $jsonData = '{"country":[{"id":"1","countryName":"India","countryCode":"IN"},{"id":"2","countryName":"America","countryCode":"USA"}],"interest":[{"id":"10","interestName":"Cricket"},{"id":"2","interestName":"Foot Ball"}],"users":' . json_encode($_SESSION["userData"]) . '}';
}

$outputArray = array();
$outputArray["header"] = array("error" => 0, "success" => 1, "message" => "This is a message from server");
$outputArray["data"] = json_decode($jsonData);
ob_start();
echo json_encode($outputArray);
exit;
?>
