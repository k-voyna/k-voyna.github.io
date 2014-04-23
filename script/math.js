/* Постоянная Эйлера-Маскерони   */
Math.GAMMA = 0.57721566490153286060;

/* Точность вычисления интегральных функций */
Math.EPS = 1e-16;

/* Интегральный синус */
Math.Si = function (x) {"use strict";

    var term, sum, termS, termC, sumS, sumC, k, add, result;

    if (Math.abs (x) < 4 * Math.PI) {
        term = x;
        sum = x;

        for ( k = 2; k < 50; k += 2) {
            term = -term * x / (k + 1) * x / k;
            add = term / (k + 1);
            sum += add;

            if (Math.abs (add) < Math.EPS) {
                break;
            }
        }

        result = sum;
    } else {
        sumS = 1 / x;
        sumC = 1;
        termS = 1 / x;
        termC = 1;

        for ( k = 2; k < 10; k += 2) {
            termC = -termC * k * (k - 1) / x / x;
            termS = -termS * k * (k + 1) / x / x;
            sumS += termS;
            sumC += termC;
        }

        result = Math.PI / 2 - sumC * Math.cos (x) / x - sumS * Math.sin (x) / x;
    }

    return result;
};

/* Интегральный косинус */
Math.Ci = function (x) {"use strict";

    var term, sum, termS, termC, sumS, sumC, k, add, result;

    if (Math.abs (x) < 4 * Math.PI) {
        sum = Math.GAMMA + Math.log (x);
        term = 1;

        for ( k = 2; k < 50; k += 2) {
            term = -term * x / k * x / (k - 1);
            add = term / k;

            sum += add;

            if (Math.abs (add) < Math.EPS) {
                break;
            }
        }

        result = sum;
    } else {
        sumC = 1 / x;
        sumS = 1;
        termC = 1 / x;
        termS = 1;

        for ( k = 2; k < 10; k += 2) {
            termS = -termS * k * (k - 1) / x / x;
            termC = -termC * k * (k + 1) / x / x;
            sumS += termS;
            sumC += termC;
        }

        result = sumS / x * Math.sin (x) - sumC / x * Math.cos (x);
    }

    return result;
};

/* ограничение */
Math.clamp = function (x, xmin, xmax) {"use strict";
    var result;
    
    if (x < xmin) {
        result = xmin;
    } else if (x > xmax) {
        result = xmax;
    } else {
        result = x;
    }
    
    return result;
};

Math.log10 = function (x) {"use strict";
    return Math.log (x) / Math.LN10;
};

/* гиперболический синус */
Math.sh = function (x) {"use strict";
    return (Math.exp (x) - Math.exp (-x)) / 2;
};

/* гиперболический косинус */
Math.ch = function (x) {"use strict";
    return (Math.exp (x) + Math.exp (-x)) / 2;
};

/* гиперболический тангенс */
Math.th = function (x) {"use strict";
    return (Math.exp (2 * x) - 1) / (Math.exp (2 * x) + 1);
};

/* гиперболический котангенс */
Math.cth = function (x) {"use strict";
    return (Math.exp (2 * x) + 1) / (Math.exp (2 * x) - 1);
};

/* интерполяция по табличным данным */
Math.interpolate = function (fx, x) {"use strict";
    var i, iout, imin, imax, length;
    length = fx.length;
    
    if (x < fx [0][0] || x > fx [length - 1][0]) {
        return NaN;
    }
    
    imin = 0;
    imax = fx.length - 2;
    for ( ; ; ) {
        i = imin + ((imax - imin) >>> 1);
        if (iout === i) {
            break;
        }
        
        if (x > fx [i][0]) {
            imin = iout = i; 
        } else {
            imax = iout = i;
        }
    }  
    
    return fx [iout][1] + (fx [iout + 1][1] - fx [iout][1]) * (x - fx [iout][0]) / (fx [iout + 1][0] - fx [iout][0]);
};
