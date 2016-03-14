#!/bin/sh

touch devices.txt
curl https://raw.githubusercontent.com/smoyerman/edison-ibeacon/master/ibeacon > ibeacon
chmod +x ibeacon
