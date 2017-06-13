# VRipper X
VRipper X is a fork of VRipper, originally developed and maintained by
[Viller](https://bitbucket.org/Viller/), which aims to continue its development
and provide routine maintanence.

## Features & Behaviour
 - Clipboard monitoring
 - Support `vr:t=123` links on MacOS
 - Checking for duplicate tasks
 - Setting and state are saved in `~/.VRipper X` (gzipped JSON)
 - File size filter (files below 10KB considered garbage)
 - Clean thread names from garbage
 - Only posts with 3 or more pictures considered worthy downloading
 - Download single page of thread (thread_url/page42)
 - Additionally support 4chan, imgur, VK

## Supported Image Hosts (Updated: 24.5.2017)
> Note: These are the hosts that have been given priority for testing and are, as a result, guaranteed to work.

 - acidimg.cc
 - coreimg.net
 - imagetwist.com
 - ima.gy
 - img.yt
 - imgchili.net
 - picz.site
 - fastpic.ru
 - imageho.me
 - imageshack.com
 - imageupper.com
 - imgbox.com
 - picstate.com
 - pixhost.org
 - postimage.org
 - sharenxs.com
 - turboimagehost.com
 - picpie.org
 - pimpandhost.com
 - imagevenue.com
 - picsee.net
 - imagezilla.net
 - imagebam.com

## Settings

#### Original Filename
Default **false**.
For many image hostings we can derive full-sized image url from thumbnail url,
therefore speeding up process by at least one http request.
Setting it to **true** will force looking up original file name on hosting page.

#### Prefix folders with thread ids
Default **true**. That's supposed to help reference saved album to original thread.

#### Make subfolders for threads with more than one content post
Default **true**.

#### Prefix subfolders with post index
Default **true**.

#### Choose root download folder
Default **~/VRipper X**.

## Build Dependencies
 - Node.js

## Build Instructions
 - Clone this repository and navigate to its directory in your terminal
 - Run "npm install" to install all of the required node modules locally
 - Run the "build.sh" script to build and package the application
