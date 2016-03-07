// door.js
var mraa = require('mraa');

var p0 = new mraa.Pwm(20); // J18-7
p0.period_us(19500);
var duty0min = 0.03;
var duty0max = 0.128;
var duty0 = (duty0min + duty0max) / 2;

// 解錠処理
var unlock = function() {
  p0.enable(true);

  // 解錠
  p0.write(duty0max);

  // GPIO を解放する。
  setTimeout(function(){
    p0.enable(false);
  }, 1000);
};

// 施錠処理
var lock = function() {
  p0.enable(true);

  // 施錠
  p0.write(duty0);

  // GPIOを解放する。
  setTimeout(function(){
    p0.enable(false);
  }, 1000);
};

exports.unlock = unlock;
exports.lock = lock;


// デバッグ用
// usage: node door.js [unlock|lock]
{
  var command = process.argv[2];
  if (command == 'unlock') {
    unlock();
    console.log('Unlock.');
  } else if (command == 'lock') {
    lock();
    console.log('Lock.');
  }
}
