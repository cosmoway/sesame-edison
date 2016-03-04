var http = require('http')
  , url = require('url')
  , qs = require('qs')
  , fs = require('fs')
  , crypto = require('crypto')
  , dateFormat = require('dateformat')
  , exec = require('child_process').exec;

var app = (function() {
  var major = 0;
  var minor = 0;
  var devices = [];
  var timeoutID;

  var createHashString = function(data) {
    // data フォーマット `[name]:[uuid]`
    var uuid = data.split(':').pop();
    var text = uuid + '|' + major + '|' + minor;
    var hash = crypto.createHash('sha256');
    hash.update(text);
    text = hash.digest('hex');
    console.log({hash: text});
    return text;
  };

  var writeLog = function(file, data) {
    fs.appendFile('./log/' + file, data ,'utf8', function (err) {
      console.log(err);
    });
  };

  var auth = function(data) {
    console.log({devices: devices, data: data});

    // 該当するデバイス
    var target = null;
    devices.forEach(function(device) {
      if (createHashString(device).toUpperCase() == data.toUpperCase()) {
        // 認証に成功
        target = device;
        return false;
      }
    });

    // 結果を log に記録する
    var logtext = (function(device, data) {
      var result = (device != null);
      var body = result ?
          'name=%name%'.replace(/%name%/, device.split(':')[0]) :
          'data=%data%, major=%major%, minor=%minor%'
              .replace(/%data%/, data)
              .replace(/%major%/, major)
              .replace(/%minor%/, minor);

      // 記録する内容は、現在時刻、結果、UUIDの 3点
      // (認証に失敗した場合は、data, major, minor を記録する)
      return '[%date%] [%result%] %body%\n'
          .replace(/%date%/, dateFormat())
          .replace(/%result%/, result ? 'OK' : 'NG')
          .replace(/%body%/, body);
    })(target, data);
    writeLog('auth.log', logtext);

    // 該当するデバイスがあれば認証成功
    return (target != null);
  };

  var refresh = function() {
    // タイマーをクリア
    clearTimeout(timeoutID);

    // major, minor を変更
    major = Math.floor(Math.random() * 65536);
    minor = Math.floor(Math.random() * 65536);
    console.log({major: major, minor: minor});

    // Beacon 再起動
    var uuid = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    var measuredPower = 59;

    var command = './ibeacon -z && ./ibeacon -u %UUID% -M %major% -m %minor% -p %power%'
        .replace(/%UUID%/, uuid)
        .replace(/%major%/, major)
        .replace(/%minor%/, minor)
        .replace(/%power%/, measuredPower);
    exec(command, function(err, stdout, stderr) {
      console.log({err: err, stdout: stdout, stderr: stderr});
    });

    // 1分ごとにリフレッシュされるようタイマーを設定
    var delay = 60000;
    timeoutID = setTimeout(refresh, delay);
  };

  // 初期化処理
  (function() {
    // 鍵として有効な端末リストの読込
    fs.readFile('./devices.txt', 'utf8', function(err, text) {
      devices = text.split('\n').filter(function(device) {
        // 空の行を取り除く
        return (device != '');
      });
    });
    refresh();
  })();

  return {
    auth : auth,
    refresh : refresh
  };
})();

http.createServer(function (req, res) {
  var query = url.parse(req.url, true).query;
  var data = query['data'];
  if (data == null) {
    res.writeHead(400, {'Content-Type': 'text/plain'});
    res.end('400 Bad Request');
    console.log({status: 400, query: query});
    return;
  }

  // 認証
  if (app.auth(data)) {
    // TODO: ドアを解錠する

    // major, minor を更新する
    app.refresh();

    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('200 OK');
    console.log({status: 200, data: data});

  } else {
    res.writeHead(403, {'Content-Type': 'text/plain'});
    res.end('403 Forbidden');
    console.log({status: 403, data: data});
  }
}).listen(process.env.SESAME_APP_PORT || 10080);
