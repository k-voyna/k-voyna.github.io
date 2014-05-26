Groundwave = {
    // напряженность поля для идеальной среды
    E0 : function (P, d, fnD, eta, Theta) {          
        // XXX:
        //return Math.sqrt ((Phys.Z0 / Math.PI) / 2 * P * fnD (Theta) * eta) / d;
        return 300 * Math.sqrt (P * fnD (Theta) * eta * 1e-3) / d;
    },

    // коэффициент затухания поверхностной волны [Гинкин Г.Г. Справочник по радиотехнике 1948, с. 740]
    // формула Зоммерфельда-Шулейкина
    GroundFactor : function (lambda, d, sigma, eps) {
        var jeps = Phys.Z0 / (2 * Math.PI) * lambda * sigma;           
        var k1 = Math.sqrt (Math.pow (eps - 1, 2) + Math.pow (jeps, 2));
        var k2 = (Math.pow (eps, 2) + Math.pow (jeps, 2));
        var rho = Math.PI * d / lambda * k1 / k2;

        return (2 + 0.3 * rho) / (2 + rho + 0.6 * Math.pow (rho, 2)) - Math.sqrt (rho / 2) * Math.exp (-5 * rho / 8);
    },
    
    // поправка на ближнее поле (R-REC-P.368-9-200702-I)
    NearFieldFactor : function (lambda, r) {
        var k = 2 * Math.PI / lambda;
        return 1 - 1 / Math.pow (k * r, 2) + 1 / Math.pow (k * r, 4);
    },
    
    // формула коэффициента ослабления Остина для морской поверхности
    AustinFactor : function (lambda, d, sigma, eps) {
        var Theta = d / Phys.Re;
        // формула с оригинальными коэффициентами
        // return Math.exp (-0.0014e-3 * d / Math.pow (lambda * 1e-3, 0.6)) * Math.sqrt (Theta / Math.sin (Theta));
        
        // калибровка по графикам ITU-R
        return Math.exp (-0.0027e-3 * d / Math.pow (lambda * 1e-3, 0.2)) * Math.sqrt (Theta / Math.sin (Theta));
    },   
    /*
    // коэффициент Фока для НЧ и СЧ (Долуханов) и антенн на уровне гладкой сферичечской земли
    FokFactor : function (lambda, d, sigma, eps) {
        var a = Phys.Re;
        var A = new Complex (0, Math.pow (Math.PI * a / lambda, 1/3));
        var B = new Complex (eps, -(Phys.Z0 / Math.PI / 2) * lambda * sigma).pow (1/2);
        var q = A.div (B);
        var L = Math.pow (lambda * Math.pow (a, 2) / Math.PI, 1/3);
        var x = d / L;
        var C = new Complex (0, -2 * Math.PI / 3).exp ();        
        
        var t1q0   = new Complex (1.019, 0).div (C);
        var t1qInf = new Complex (2.338, 0).div (C);
        
        var t1qA = t1q0.sum (new Complex (1, 0).div (t1q0).mul (q));
        var t1qB = t1qInf.sum (new Complex (1, 0).div (t1qInf).mul (q));
        var zA = q.div (t1qA.pow (1/2)).mod ();
        var zB = q.div (t1qB.pow (1/2)).mod ();
      //  alert (zA + ' ' + t1qA.mod () + ', ' + zB + ' ' + t1qB.mod ());
                
        var q2 = q.mul (q);
        var t1q = zA > 1 ? t1qB : zB < 1 ? t1qB : t1qA;
        return 2 * Math.sqrt (Math.PI * x) * (new Complex (0, x).mul (t1q).exp ().div (t1q.sum (q2))).mod ();
    },
    */
    // поправка на кривизну поверхности Земли
    DiffractionFactor : function (lambda, d, sigma, eps) {
        return Groundwave.AustinFactor (lambda, d, sigma, eps);
    }
};

Skywave = {
    // зенитный угол прихода ионосферной волны
    ZenithAngle : function (D, H) {
        var gamma = D / (2 * Phys.Re);
        var Theta = Math.atan ((Phys.Re + H) * Math.sin (gamma) / ((Phys.Re + H) * Math.cos (gamma) - Phys.Re));
        return Theta >= 0 ? Theta : Math.PI / 2;
    },
    
    // поправка на затухание за пределами дальности односкачкового распространения
    DistanceFactor : function (lambda, d) {
        return Math.exp (-8.94e-7 * Math.pow (lambda * 1e-3, -0.26) * d);
    },

    // поправки на магнитное наклонение
    DELTAJ : {
        50: [[1e6, 0], [2e6, 0.5], [2.5e6, 1], [3.4e6, 2], [10e6, 6]],
        55: [[1e6, 0], [2e6, 0.5], [2.5e6, 1], [3.4e6, 2], [10e6, 6]],
        60: [[1e6, 0], [2e6, 0], [2.5e6, 0], [3.4e6, 0.5], [10e6, 1.5]],
        65: [[1e6, 0], [2e6, -2], [2.5e6, -3], [3.4e6, -6], [10e6, -18]],
        70: [[1e6, -0.5], [2e6, -7], [2.5e6, -12], [3.4e6, -22], [10e6, -66]],
        75: [[1e6, -1], [2e6, -8], [2.5e6, -14], [3.4e6, -25], [10e6, -75]]
    },
    
    // поправки на время суток и надежность прогнозирования
    DELTAN : {        
        16: [[1, 0], [10, -17], [50, -50], [90, -80], [99, -106]],
        17: [[1, 4], [10, -10], [50, -30], [90, -65], [99, -90]],
        18: [[1, 6], [10, -4], [50, -18], [90, -50], [99, -74]],
        19: [[1, 7], [10, 0], [50, -10], [90, -36], [99, -58]],
        20: [[1, 8], [10, 2], [50, -5], [90, -20], [99, -42]],
        21: [[1, 8], [10, 3.5], [50, -3], [90, -12], [99, -26]],
        22: [[1, 8.5], [10, 4.5], [50, -1], [90, -8], [99, -16]],
        23: [[1, 9], [10, 5], [50, 0], [90, -6], [99, -13]],
         0: [[1, 9.5], [10, 6], [50, 0.5], [90, -5.5], [99, -12]],
         1: [[1, 10], [10, 6.25], [50, 1], [90, -5.5], [99, -12.5]],
         2: [[1, 10.5], [10, 6.5], [50, 1], [90, -6], [99, -16]],
         3: [[1, 11], [10, 6.75], [50, 0], [90, -9], [99, -36]],
         4: [[1, 12], [10, 6], [50, -3], [90, -18], [99, -50]],
         5: [[1, 12], [10, 3], [50, -10], [90, -36], [99, -64]],
         6: [[1, 11.5], [10, -1], [50, -22], [90, -55], [99, -78]],
         7: [[1, 10], [10, -8], [50, -42], [90, -74], [99, -92]]
    },
        
    // поправка МККР
    CCIRFactor : function (M, T, P, W, D) {
        D = D <= 1e6 ? 1e6 : D >= 10e6 ? 10e6 : D;
        P = P < 1 ? 1 : P > 99 ? 99 : P;
        var dbFactor = Math.interpolate (Skywave.DELTAJ [M], D) + Math.interpolate (Skywave.DELTAN [T], P) - 0.02 * W;
        return Math.pow (10, dbFactor / 20);
    },
    
    // длина трассы распространения пространственной волны
    BeamDistance : function (D, H) {
        var gamma = D / (2 * Phys.Re);
        return 2 * Math.sqrt (Math.pow (Phys.Re * Math.sin (gamma), 2) + Math.pow (Phys.Re * (1 - Math.cos (gamma)) + H, 2));
    },
    
    // пределельная дальность односкачкового распространения
    SingleHopMaximalDistance : function (H) {
        return 2 * Math.acos (Phys.Re / (Phys.Re + H)) * Phys.Re;
    }
};