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

	fnWireWaveImpedance : function (l, d) {"use strict";
		return (Phys.Z0 / Math.PI) * (Math.log (l / (d / 2)) - 1) / 2;
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

function MonopoleRadiator (h, d, g, mu, A) {"use strict";
	// TODO: Проверки входных величин

	var W, f0, lambda0;

	// волновое сопротивление
	W = Antenna.fnWireWaveImpedance (h, d);

	// сопротивление излучения
	function fnZSn (lambda) {
		return Antenna.fnDipoleRadiationImpedance (lambda, h).div (new Complex (2, 0));
	}

	// погонное сопротивление потерь
	function fnR1 (lambda) {
		return Antenna.fnWireLossResistance (lambda, d, g, mu);
	}

	// погонное сопротивление излучения
	function fnZS1 (lambda) {
		var k1, k, beta, m, ZS1;

		// FIXME: расчет поправки
		k1 = 1.00;
		k = 2 * Math.PI / lambda;
		beta = k1 * k;
		m = (1 - Math.sin (2 * beta * h) / (2 * beta * h));
		return fnZSn (lambda).div (new Complex (h * m, 0));
	}

	// эквивалентное погонное сопротивление потерь линии
	function fnZ1 (lambda, fnR1) {
		return new Complex (fnR1 (lambda) / 2, 0).sum (fnZS1 (lambda)); // XXX: а точно делить на 2?
	}

	// эквивалентное волновое сопротивление
	function fnW1 (lambda, fnR1) {
		var k, alpha;
		k = 2 * Math.PI / lambda;
		alpha = fnZ1 (lambda, fnR1).div (new Complex (W, 0));

		return new Complex (W, 0).mul (alpha.div (new Complex (k, 0)).mul (new Complex (0, -1)).sum (new Complex (1, 0)));
	}

	// входное сопротивление антенны
	function fnZ (lambda, fnR1) {
		var k, k1, W1, alpha, beta;
		W1 = fnW1 (lambda, fnR1);
		k = 2 * Math.PI / lambda;
		alpha = fnZ1 (lambda, fnR1).div (new Complex (W, 0));
		// FIXME: расчет поправки
		k1 = 1.00;
		beta = k1 * k;

		return Antenna.fnLossyOpenedTransmissionLineInputImedance (W1, h, alpha, beta);
	}

	// резонансная частота и собственная длина волны
	f0 = Antenna.fnResonance (function (f) {
		var lambda = Phys.C / f;
		return fnZ (lambda, fnR1).y;
	}, [10e3, 1000e6], 1);

	lambda0 = Phys.C / f0;

	this.fn = function (lambda) {
		var result, ZSn, R1, Z1, W1;

		ZSn = fnZSn (lambda);
		R1 = fnR1 (lambda);
		Z1 = fnZ1 (lambda, fnR1);
		W1 = fnW1 (lambda, fnR1);

		result = {};

		result.h = h;
		result.lambda0 = lambda0;
		result.ZSn = ZSn;
		result.f0 = f0;
		result.R1 = R1;
		result.Z1 = Z1;
		result.W1 = W1;
		result.W = W;

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

		// сопротивление заземления
		result.Rg = A * lambda / lambda0;

		// Zвх
		result.Z = fnZ (lambda, fnR1).sum (new Complex (result.Rg, 0));

		// Rизл.
		result.RS = fnZ (lambda, function (lambda) {
			return 0;
		}).x;

		// КПД
		// FIXME: врет при h~lambda. Делить на модуль импеданса?
		result.eta = result.RS / result.Z.x;

		return result;
	};
}

function IdealMonopoleRadiator (h, d) {"use strict";
	return new MonopoleRadiator (h, d, Infinity, 1, 0);
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