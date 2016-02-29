var http = require('http')
  , url = require('url')
  , qs = require('qs')
  , fs = require('fs')
  , crypto = require('crypto')
  , bleacon = require('bleacon');

var app = (function() {
  var major = 0;
  var minor = 0;
  var devices = [];

  // 初期化処理
  (function() {
    // 鍵として有効な端末リストの読込
    fs.readFile('./devices.txt', 'utf8', function (err, text) {
      devices = text.split('\n').filter(function(device) {
        // 空の行を取り除く
        return (device != '');
      });
    });
  })();

  var createHashString = function(data) {
    var text = data + '|' + major + '|' + minor;
    var hash = crypto.createHash('sha256');
    hash.update(text);
    text = hash.digest('hex');
    console.log({hash: text});
    return text;
  }

  var auth = function(data) {
    console.log({devices: devices, data: data});

    var result = false;
    devices.forEach(function(device) {
      if (createHashString(device) == data) {
        // 認証に成功
        result = true;
        return false;
      }
    });
    return result;
  };

  return {
    auth : auth,
    major : major,
    minor : minor
  };
})();

http.createServer(function (req, res) {
  var query = url.parse(req.url, true).query;
  var data = query['data'];
  if (data == null) {
    res.writeHead(400, {'Content-Type': 'text/plain'});
    res.end('400 Bad Request');
    return;
  }

  // 認証
  if (app.auth(data)) {
    // TODO: ドアを解錠する
    // TODO: major, minor を更新する

    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('200 OK');

  } else {
    res.writeHead(403, {'Content-Type': 'text/plain'});
    res.end('403 Forbidden');
  }
}).listen(process.env.SESAME_APP_PORT || 10080);

var uuid = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
var measuredPower = -59;

bleacon.startAdvertising(uuid, app.major, app.minor, measuredPower);
