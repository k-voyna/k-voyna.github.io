/*jslint plusplus: true */
/*global Complex: true, Phys: true */
Antenna = {
	fnMaxFunctionValue : function (fn, argMin, argMax) {"use strict";
		var arg, step, max;

		max = -Infinity;
		step = (argMax - argMin) / 1000;

		for ( arg = argMin; arg < argMax; arg += step) {
			if (fn (arg) > max) {
				max = fn (arg);
			}
		}

		return max;
	},

	fnSearch : function (fnX, bounds, value, min) {"use strict";
		var yleft, yright, xleft, xright;

		xleft = bounds [0];
		xright = bounds [0];
		yleft = fnX (xleft);
		yright = fnX (xright);

		for (; ; ) {
			if (yleft < value && yright < value) {
				yleft = yright;
				xleft = xright;
				xright = xright * 1.1;
				yright = fnX (xright);
			} else if (yleft < value && yright > value) {
				xright = xleft + (xright - xleft) / 2;
				yright = fnX (xright);
			} else {
				xleft = NaN;
				break;
			}

			if (Math.abs (yleft - value) < min) {
				break;
			}

			if (xleft > bounds [1] || isNaN (yleft) || isNaN (yright)) {
				xleft = NaN;
				break;
			}
		}

		return xleft;
	},

	fnResonance : function (fX, bounds, min) {"use strict";
		var Xleft, Xright, Fleft, Fright;

		Fleft = bounds [0];
		Fright = bounds [0];
		Xleft = fX (Fleft);
		Xright = fX (Fright);

		for (; ; ) {
			if (Xleft < 0 && Xright < 0) {
				Xleft = Xright;
				Fleft = Fright;
				Fright = Fright * 1.1;
				Xright = fX (Fright);
			} else if (Xleft < 0 && Xright > 0) {
				Fright = Fleft + (Fright - Fleft) / 2;
				Xright = fX (Fright);
			} else {
				Fleft = NaN;
				break;
			}

			if (Math.abs (Xleft) < min) {
				break;
			}

			if (Fleft > bounds [1] || isNaN (Xleft) || isNaN (Xright)) {
				Fleft = NaN;
				break;
			}
		}

		return Fleft;
	},

	fnWireWaveImpedance : function (l, d, lambda) {"use strict";
		return (Phys.Z0 / Math.PI) * (Math.log (l / (d / 2)) - 1) / 2;
	},

	fnWireWaveImpedanceV2 : function (lambda, d) {"use strict";
		return (Phys.Z0 / Math.PI) * (Math.log (lambda / (d / 2)) - Math.GAMMA) / 2;
	},
    
	fnDipoleRadiationImpedance : function (lambda, l) {"use strict";
		var Ci2x, Ci4x, Si2x, Si4x, sin2x, cos2x, lnx, ln2x, W, RS0, XS0, x;

		x = 2 * Math.PI / lambda * l;

		// чтобы не зависнуть
		if (x > 1000) {
			return new Complex (NaN, NaN);
		}

		Ci2x = Math.Ci (2 * x);
		Ci4x = Math.Ci (4 * x);
		Si2x = Math.Si (2 * x);
		Si4x = Math.Si (4 * x);

		sin2x = Math.sin (2 * x);
		cos2x = Math.cos (2 * x);
		lnx = Math.log (x);
		ln2x = Math.log (2 * x);

		W = Phys.Z0 / (4 * Math.PI);

		// Гинкин Г.Г. Справочник по радиотехнике 1948, с. 606, форм. 90
		// Комплексное сопротивление излучения (в пучности тока)
		// Жук М.С., Молочков Ю.Б., Проектирование антенно-фидерных устройств Л.-1966, c. 110-111 (3-8, 3-9)
		RS0 = W * (2 * (Math.GAMMA + ln2x - Ci2x) + cos2x * (Math.GAMMA + lnx + Ci4x - 2 * Ci2x) + sin2x * (Si4x - 2 * Si2x));
		XS0 = W * (2 * Si2x + cos2x * (2 * Si2x - Si4x) + sin2x * (Math.GAMMA + lnx + Ci4x - 2 * Ci2x - 2));

		return new Complex (RS0, XS0);
	},

	fnWireLossResistance : function (lambda, d, g, mu) {"use strict";
		return 5.5 / (d / 2) * Math.sqrt (mu / (g * lambda));
	},

	fnPerfectLoadedTransmissionLineInputImpedance : function (kl, W, ZL) {"use strict";
		var Z0, coskl, sinkl, ZLcoskl, jZLsinkl, Z0coskl, jZ0sinkl, Z1, Z2;

		Z0 = new Complex (W, 0);
		coskl = new Complex (Math.cos (kl), 0);
		sinkl = new Complex (0, Math.sin (kl));

		ZLcoskl = ZL.mul (coskl);
		jZLsinkl = ZL.mul (sinkl);
		Z0coskl = Z0.mul (coskl);
		jZ0sinkl = Z0.mul (sinkl);

		Z1 = ZLcoskl.sum (jZ0sinkl);
		Z2 = Z0coskl.sum (jZLsinkl);

		return Z0.mul (Z1).div (Z2);
	},

	fnLossyOpenedTransmissionLineInputImedance : function (W1, l, alpha, beta) {"use strict";
		return W1.mul (alpha.sum (new Complex (0, beta)).mul (new Complex (l, 0)).cth ());
	}
};

function MonopoleRadiator (h, D, d, N, g, mu, ground) {"use strict";
	// TODO: Проверки входных величин
	// волновое сопротивление      
    function fnZGn (lambda) {
        return ground.fn (lambda).Zn;
    }    
    
    function fnZ0 (lambda) {
        return new Complex (0, 0);
    }
    
	function fnR0 (lambda) {
		return 0;
	}    
      
	// сопротивление излучения
	function fnZSn (lambda) {
		return Antenna.fnDipoleRadiationImpedance (lambda, h).div (new Complex (2, 0));
	}

	// погонное сопротивление потерь
	function fnR1 (lambda) {
		return Antenna.fnWireLossResistance (lambda, d, g, mu) / N;
	}

	// погонное сопротивление потерь
	function fnZn (lambda, beta, fnZSn, fnZGn) {
		var m, ZS1;

		// FIXME: расчет поправки
		var m = (1 - Math.sin (2 * beta * h) / (2 * beta * h));
		return fnZSn (lambda).sum (fnZGn (lambda)).div (new Complex (h * m, 0));
	}

	// эквивалентное погонное сопротивление потерь линии
	function fnZ1 (lambda, beta, fnZSn, fnR1, fnZGn) {
		return new Complex (fnR1 (lambda) / 2, 0).sum (fnZn (lambda, beta, fnZSn, fnZGn)); // XXX: а точно делить на 2?
	}

	// эквивалентное волновое сопротивление
	function fnW1 (k, W, alpha) {
		return new Complex (W, 0).mul (alpha.div (new Complex (k, 0)).mul (new Complex (0, -1)).sum (new Complex (1, 0)));
	}

	// параметры антенны
	function fnY (lambda, fnZSn, fnR1, fnZGn) {
        var result = [];
    
        // FIXME: расчет поправки
        result.k1 = 1.00;
		result.k = 2 * Math.PI / lambda;
        result.beta = result.k1 * result.k;
        result.W = Antenna.fnWireWaveImpedance (h, D);
        result.Z1 = fnZ1 (lambda, result.beta, fnZSn, fnR1, fnZGn);
        result.alpha = result.Z1.div (new Complex (result.W, 0));
        result.W1 = fnW1 (result.k, result.W, result.alpha);
		result.Z = Antenna.fnLossyOpenedTransmissionLineInputImedance (result.W1, h, result.alpha, result.beta);
        
        return result;
	}

	// резонансная частота и собственная длина волны
	var f0 = Antenna.fnResonance (function (f) {
		var lambda = Phys.C / f;
		return fnY (lambda, fnZSn, fnR1, fnZGn).Z.y;
	}, [10e3, 1000e6], 1);

	var lambda0 = Phys.C / f0;

	this.fn = function (lambda) {
        var gnd = ground.fn (lambda);
		var ZSn = fnZSn (lambda);
		var R1 = fnR1 (lambda);		
               
        // глубина погружения тока       
		var result = {};

		result.h = h;
		result.lambda0 = lambda0;
		result.f0 = f0;
        
        // FIXME: Упорядочить
		result.ZSn = ZSn;
        result.Zgn = gnd.Zn;
        result.Sg = gnd.S;
		result.R1 = R1;

        // TODO: Учет влияния неидеальной земли
        
		// F (Theta) диаграмма направленности в вертикальной плоскости
		result.fnF = function (Theta) {
			var k = 2 * Math.PI / lambda;
			return (Math.cos (k * h * Math.cos (Theta)) - Math.cos (k * h)) / Math.sin (Theta);
		};

		// D (Theta) КНД
		result.fnD = function (Theta) {
			return (Phys.Z0 / Math.PI) * Math.pow (result.fnF (Theta), 2) / ZSn.x;
		};

		// КНД макс.
		// FIXME: упростить выражение
		result.D = Phys.Z0 / Math.PI * Math.pow (Antenna.fnMaxFunctionValue (result.fnF, -Math.PI / 2, Math.PI / 2), 2) / ZSn.x;
             
        var Y = fnY (lambda, fnZSn, fnR1, fnZGn);
        result.Z = Y.Z;
		result.Z1 = Y.Z1;
		result.W1 = Y.W1;                
		result.W = Y.W;
        result.C = 1 / (result.W * Phys.C / h);
        result.L = Math.pow (result.W, 2) * result.C;
        
		// Rзаземл.
		result.Rg = fnY (lambda, fnZ0, fnR0, fnZGn).Z.x;
        
		// Rизл.
		result.RS = fnY (lambda, fnZSn, fnR0, fnZ0).Z.x;
                
		// КПД
		// FIXME: врет при h~lambda. Делить на модуль импеданса? Считать по пучности?
		result.eta = result.RS / result.Z.x;

		return result;
	};
}

function IdealMonopoleRadiator (h, d) {"use strict";
	return new MonopoleRadiator (h, d, Infinity, 1, 1, 0, new IdealGround ());
}

function IdealIsotropicRadiator () {"use strict";
	this.fn = function (lambda) {
		var result = {};

		// высота антенны
		result.h = 0;

		// сопротивление излучения
		result.RS = Phys.Z0 / Math.PI;

		// входное сопротивление антенны
		result.Z = new Complex (this.RS, 0);

		// диаграмма направленности в вертикальной плоскости
		result.fnF = function (Theta) {
			return 1;
		};

		// КНД
		result.fnD = function (Theta) {
			return 1;
		};

		result.D = 1;
		result.eta = 1;

		return result;
	};
}

function MagneticLoop (S, p, l, d, N, g, mu) {"use strict";
	// TODO: Проверки входных величин

	// сопротивление излучения
	function fnRS (lambda) {
		var hg = 2 * Math.PI * N * S / lambda;
		return 800 * Math.pow (hg / lambda, 2);
	}

	// погонное сопротивление потерь
	function fnR1 (lambda) {
		return Antenna.fnWireLossResistance (lambda, d, g, mu);
	}
   
	function fnZL (lambda) {
		return new Complex (0, N * N * Phys.Z0 * p / lambda * (Math.log (2.54 * p / d) - 2));
	}

	function fnZ (lambda, fnR1) {
		var Rl, RS, omega, XL, XC;

		RS = fnRS (lambda);
		Rl = fnR1 (lambda) * l;

		return new Complex (RS + Rl, 0).sum (fnZL (lambda));
	}

	this.fn = function (lambda) {
		var result;

		result = {};

		result.R1 = fnR1 (lambda);
       
		// КНД
		result.D = 1.5;

		// Zвх
		result.Z = fnZ (lambda, fnR1);

		// Rизл.
		result.RS = fnRS (lambda);

		// Rпот
		result.Rl = l * result.R1;

		// КПД
		result.eta = result.RS / result.Z.x;

		// Э.Д.С. эквивалентного генератора
		result.fnE = function (E) {
			return E * lambda * Math.sqrt (result.D * result.eta * result.Z.x / (4 * Phys.Z0 * Math.PI));
		};

		return result;
	};
}

function LongWire (h, l, b, nb, f, d, g, mu, A) {"use strict";
	// TODO: Проверки входных величин
	// l/h <= 0,3
	// kr <= 0,01

	var W, Wb, cosksi;

	cosksi = h / l;

	// волновое сопротивление вертикальной части
	W = Antenna.fnWireWaveImpedance (l, d);
	// XXX: а для h != l?

	// волновое сопротивление горизонтальной части
	Wb = Antenna.fnWireWaveImpedance (b, d);
	// XXX: а для f != 0?

	// погонное сопротивление потерь
	function fnR1 (lambda) {
		return Antenna.fnWireLossResistance (lambda, d, g, mu);
	}

	this.fn = function (lambda) {
		var result, k, Z, be, le, lg, lr, RS0;

		k = 2 * Math.PI / lambda;
		
		// эквивалентное удлинение
		// Кочержевский Г.Н. Антенно-фидерные устройства. 1989. с. 73	
		be = (Math.atan (W / (Wb / Math.tan (k * b) / nb)) + Math.PI) % (Math.PI) / k;
		
		le = l + be;

		// действующая длина
		// Кочержевский Г.Н. Антенно-фидерные устройства. 1989. с. 71. (3.37)
		// Белоцерковский Г.Б. Основы радиотехники и антенны. т.2. с.116
		lg = (Math.cos (k * be) - Math.cos (k * le)) / (Math.sin (k * le) * k) * cosksi;

		lr = 2 * Math.atan (lg * k) / k;
			
		RS0 = Antenna.fnDipoleRadiationImpedance (lambda, lr).x / 2;

		result = {};

		result.W = W;
		result.Wb = Wb;
		result.R1 = fnR1 (lambda);
		result.le = le;
		result.be = be;
		result.lg = lg;

		// сопротивление излучения
		// Кочержевский Г.Н. Антенно-фидерные устройства. 1989. с. 71. (3.38)
		// result.RS = 4 / 3 * Math.PI * Phys.Z0 * Math.pow (result.lg / lambda, 2);
		
		function fnZ (lambda, fnR1) {
			var k = 2 * Math.PI / lambda;
			var be = (Math.atan (W / (Wb / Math.tan (k * b) / nb)) + Math.PI) % (Math.PI) / k;
			var le = l + be;
			var lg = Math.abs ((Math.cos (k * be) - Math.cos (k * le)) / (Math.sin (k * le) * k)) * cosksi;
			var lr = 2 * Math.atan (lg * k) / k;
			
			var sinx2 = Math.pow (Math.sin (lr * k), 2);
			var RS0 = Antenna.fnDipoleRadiationImpedance (lambda, lr).x / 2 + fnR1 (lambda) * lr * (1 - Math.sin (2 * k * lr) / (2 * k * lr));

			var aR = Math.pow (RS0 / W, 2) * Math.pow (Math.cos (k * lr), 2) + Math.pow (Math.sin (k * lr), 2);
			var aX = Math.pow (RS0 / W, 2) * Math.pow (Math.cos (k * le), 2) + Math.pow (Math.sin (k * le), 2);
						
			var R = RS0 / aR;
			var X = (W / 2) * Math.sin (2 * k * le) * (1 - Math.pow (RS0 / W, 2)) / aX;
			return new Complex (R, -X);
		}
		
		Z = fnZ (lambda, fnR1);

		// резонансная частота и собственная длина волны
		result.f0 = Antenna.fnResonance (function (f) {
			var lambda = Phys.C / f;
			return fnZ (lambda, fnR1).y;
		}, [10e3, 1000e6], 1);

		result.lambda0 = Phys.C / result.f0;

		// сопротивление заземления
		result.Rg = A * lambda / result.lambda0;

		result.Z = Z.sum (new Complex (result.Rg, 0));

		// коэффициент направленного действия
		// Кочержевский Г.Н. Антенно-фидерные устройства. 1989. с. 42. (2.32)
		result.D = Phys.Z0 / Math.PI * Math.pow (1 - Math.cos (k * lr), 2) / RS0;

		// КПД
		result.eta = fnZ (lambda, function (lambda) { return 0; } ).x / result.Z.x;

		// Э.Д.С. эквивалентного генератора
		result.fnE = function (E) {
			return E * lambda * Math.sqrt (result.D * result.eta * result.Z.x / (4 * Phys.Z0 * Math.PI));
		};

		return result;
	};
}

/*
 // XXX Сопротивление излучение у антенн с емкостной нагрузкой
 // XXX Qa
 // XXX рассчет сопротивления излучения для Г-образных
 // XXX точный расчет для наклонных
 // XXX наклон луча для Г-образных и Т-образных
 // XXX учитывать емкость между проводом и землей для низких антенн
 // XXX собственная добротность от f неизвестна
 // XXX Влияние земли

 // действующая высота наклона луча
 //  aerial.fg = (aerial.b != 0) ? (1 - Math.cos (k * aerial.b)) / (Math.sin (k * aerial.b) * k) * (aerial.f / aerial.b) : 0;

 var cosksi = aerial.h / aerial.l;
 */
 
function IdealGround () {"use strict";
    this.fn = function (lambda) {
        var result = [];
        result.S = 0;
        result.Zn = new Complex (0, 0);
        return result;        
    };
}
 
function StiftGround (h, g, eps, a, l) {"use strict";
    this.fn = function (lambda) {
        function fnX (x, k, coskl) {
            var r2 = Math.sqrt (h * h + x * x);               
            return Math.abs ((1 + Math.pow (coskl, 2) - 2 * coskl * Math.cos (k * (r2 - x)))) / x;
        };    
            
        var omega = 2 * Math.PI * Phys.C / lambda;
        var sigma = new Complex (g, omega * Phys.EPS0 * eps);

        var S = (g === Infinity) 
            ? 0 
            : 1 / Math.sqrt (Math.PI * Phys.MU0 * sigma.x * Phys.C / lambda); 
                   
        var z = Math.min (S, l);
            
        function fi (x) {
            var k = 2 * Math.PI / lambda;       
            return fnX (x, k, Math.cos (k * h)); 
        }            
            
        var Rg = (g === Infinity) 
            ? 0 
            : 1 / (2 * Math.PI * z) * (Math.integrate (fi, a / 2, 1.0, 100) 
                                     + Math.integrate (fi, 1.0, 10.0, 20) 
                                     + Math.integrate (fi, 10.0, lambda / 2, 20));
        
        var result = [];
        result.S = S;
        result.Zn = new Complex (Rg / sigma.mod (), 0);
        
        return result;
    };
}
 
function RadialGround (h, g, eps, l, A, rho, n, gr) {"use strict";
    this.fn = function (lambda) {
        var R1 = Antenna.fnWireLossResistance (lambda, rho, gr, 1);
    
        var omega = 2 * Math.PI * Phys.C / lambda;
        var sigma = new Complex (g, omega * Phys.EPS0 * eps);
        var k = 2 * Math.PI / lambda;      
        var coskl = Math.cos (k * h);    
    
        function fnX (x) {
            var r2 = Math.sqrt (h * h + x * x);               
            var fx = 1 + Math.pow (coskl, 2) - 2 * coskl * Math.cos (k * (r2 - x));
            return fx;
        };    
                  
        function fi (x) {
            return fnX (x) / x; 
        }

        function fm (x) {
            return fnX (x); 
        }        
        
        function FI (x) {
            var C = Math.PI * x / n;
            var y = 1e4 * Math.pow (12 * g * C * Math.log (C / (rho / 2) - 0.5) / lambda, 2);
            
            return y / (1 + y);
        }
        
        function fiFI (x) {
            return fi (x) * FI (x); 
        }
               
        var a = n * rho / (2 * Math.PI);
        var I1 = Math.integrate (fiFI, a, 1.0, 20);
        var I2 = Math.integrate (fiFI, Math.max (1.0, a), Math.min (A, lambda / 2), 20);
        var I3 = Math.integrate (fi, A, lambda / 2, 20);
        var I4 = Math.integrate (fm, a, A, 20);

        var S = 1 / Math.sqrt (Math.PI * Phys.MU0 * sigma.mod () * Phys.C / lambda);
        var Ig = 1 / (2 * Math.PI * Math.min (l, S)) * (I1 + I2) + 1 / (2 * Math.PI * Math.min (l, S)) * I3;       
        var Rr = R1 * I4 / n;
        
        var result = [];
        result.S = S;
        result.Zn = new Complex (Ig / sigma.mod () + Rr, 0);
        
        return result;
    };
}