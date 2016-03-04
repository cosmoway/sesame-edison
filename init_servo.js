var mraa = require('mraa');
var p0 = new mraa.Pwm(20);  // J18-7

p0.period_us(19500);
p0.enable(true);

// For servo config
var duty0min = 0.03; // min
var duty0max = 0.128; // max
var duty0 = (duty0min + duty0max) / 2;

// middle
p0.write(duty0);

// GPIOを解放する。
setTimeout(function(){
  p0.enable(false);
}, 1000);
