/*jslint plusplus: true */
/*global Phys: true, Calc: true, Complex: true */
/*global IdealIsotropicRadiator: true, IdealMonopoleRadiator: true, MonopoleRadiator: true */
/*global Grounds: true, Plots: true */

function crystal () {"use strict";
    var broadcast; 
    
    // ----------------------------------------------------- broadcast --------------------------------------------------
    broadcast = Calc.calc ({
        name : "broadcast",
        input : {
            f : [1e3],
            P : [1e3],
            D : [1e3],
            H : [1e3],
            ground : ['mountains', 'polar ice', 'forest', 'sandy soil', 'dry soil', 'wet soil', 'fresh water', 'sea water'],
            time : ['day', 'night'],
            antenna: ['.', '0.25', '0.53' , '0.65']
        },
        output : {
            lambda : [1e0, 3],
            sigma : [1e+0, 1, "exp"],
            eps : [1e+0, 2],
            Pi : [1e0, 1, "exp"],
            h : [1e0, 3],
            E0 : [1e-3, 1],
            Es : [1e-3, 1],
            Eg : [1e-3, 1],
            Emin : [1e-3, 1],
            phi : [1e0, 2],
            hs : [1e3, 2],
            E : [1e-3, 1],
            G : [1e-1, 3],
            D1 : [1e3, 2],
            dd : [1e3, 2],
            dn : [1e3, 2]
        }
    }, function () {
        var ground, antenna,
            D, Es, Eg, Ei, vEs, vEg,
            Theta, F, R, gamma, phi, rho;
        
        // проверка входных значений
        this.check (this.f >= 150e3 && this.f <= 2e6, "f");
        this.check (this.P > 0 && this.P <= 10e6, "P");
        this.check (this.D > 1 && this.D <= 10e6, "D");
        this.check (this.H >= 90e3 && this.H <= 120e3, "H");

        // длина волны
        this.lambda = Phys.C / this.f;

        // антенна передатчика
        switch (this.antenna) {
            case '.':
                antenna = new IdealIsotropicRadiator ().fn (this.lambda);
                break;
                
            case '0.25':
                antenna = new IdealMonopoleRadiator (this.lambda * 0.25, 0.25).fn (this.lambda);
                break;
                
            case '0.53':
                antenna = new IdealMonopoleRadiator (this.lambda * 0.53, 0.25).fn (this.lambda);
                break;
                
            case '0.65':
                antenna = new IdealMonopoleRadiator (this.lambda * 0.64, 0.25).fn (this.lambda);
                break;
        }

        this.h = antenna.h;
        this.G = Math.log10 (antenna.D);

        // напряженность поля для идеальной среды
        function fnE0 (P, d, fnD, Theta) {          
            return Math.sqrt ((Phys.Z0 / Math.PI) / 2 * P * fnD (Theta)) / d;
        }

        // коэффициент затухания поверхностной волны [Гинкин Г.Г. Справочник по радиотехнике 1948, с. 740]
        // формула Зоммерфельда-Шулейкина
        function fnA (lambda, d, sigma, eps) {
            var rho, jeps, A; 

            jeps = Phys.Z0 / (2 * Math.PI) * lambda * sigma;
            rho = Math.PI * d / lambda * Math.sqrt (Math.pow (eps - 1, 2) + Math.pow (jeps, 2)) / (Math.pow (eps, 2) + Math.pow (jeps, 2));
            
            return (2 + 0.3 * rho) / (2 + rho + 0.6 * Math.pow (rho, 2)) - Math.sqrt (rho / 2) * Math.exp (-5 * rho / 8);
        }

        // рассчет напряженности поля поверхностной волны
        function fnEg (lambda, P, d, fnD, sigma, eps) {
            var E0, A; 

            E0 = fnE0 (P, d, fnD, Math.PI / 2);
            A = fnA (lambda, d, sigma, eps);
            
            return E0 * A;
        }
      
        var ground = Grounds [this.ground];
        this.sigma = ground.sigma;
        this.eps = ground.eps;
        this.E0 = fnE0 (this.P, this.D, antenna.fnD, Math.PI / 2);
        this.A = fnA (this.lambda, this.D, this.sigma, this.eps);
        this.Eg = this.E0 * this.A;
        
        // центральный угол
        this.gamma = this.D / Phys.Re;
        
        // предельная дальность односкачкового распространения
        this.D1 = 2 * Math.acos (Phys.Re / (Phys.Re + this.H)) * Phys.Re;
        // высота шарового сегмента 
        this.hs = Phys.Re * (1 - Math.cos (this.gamma / 2));
        
        // угол падения ионосферной волны
        function fnTheta (D, H) {
            var Theta, gamma;
            gamma = D / (2 * Phys.Re);
            Theta = Math.atan ((Phys.Re + H) * Math.sin (gamma) / ((Phys.Re + H) * Math.cos (gamma) - Phys.Re));
            return Theta >= 0 ? Theta : Math.PI / 2;
        }
        
        // длина трассы распространения пространственной волны
        function fnR (D, H) {
            var gamma = D / (2 * Phys.Re);
            return 2 * Math.sqrt (Math.pow (Phys.Re * Math.sin (gamma), 2) + Math.pow (Phys.Re * (1 - Math.cos (gamma)) + H, 2));
        }

        // Напряженность поля при интерференции двух волн        
        function fnInterference (E1, E2, lambda, d1, d2, alpha) {
            var phi = 2 * Math.PI / lambda * (d1 - d2);
            
            return Math.sqrt (Math.pow (E1, 2) + Math.pow (E2, 2) + 2 * E1 * E2 * Math.cos (alpha) * Math.cos (phi));
        }

        // рассчет напряженности поля ионосферной волны. 
        // Формула ММКР + учет ДН передающей антенны + учет поляризации при вторичном отражении от земли (см. Надененко)
        function fnSkywave (lambda, P, fnD, D, H) {
            var Theta, k;
            
            Theta = fnTheta (D, H);
            k = (Math.sqrt (1 - Math.cos (2 * Theta)) / Math.sqrt (2));
            
            // 10233e-6 vs 14472e-6  
            return k * 0.010233 * Math.sqrt (P * fnD (Theta)) / Math.sqrt (D) * Math.exp (-8.94e-7 * Math.pow (lambda * 1e-3, -0.26) * D);
        }
       
        // зенитный угол ионосферной волны
        this.Theta = fnTheta (this.D, this.H) / Math.PI * 180;
        
        // угол падения  ионосферной волны
        this.phi = 90 - this.Theta;
        
        // напряженность пространственной волны
        this.Es = fnSkywave (this.lambda, this.P, antenna.fnD, this.D, this.H);

        // суммарная напряженность поля земной и ионосферной волны
        this.E = (this.time === "day") 
            ? this.Eg // день
            : fnInterference (this.Eg, this.Es, this.lambda, 0, 0, Math.PI); // ночь

        // минимальная напряженность для уверенного приема (Выходец А. Справочник по радиовещанию, с. 76)
        this.Emin = 1e-3 * (1e6 / this.f);

        // принимаемая мощность в изотропной идеальной антенне
        this.Pi = Math.pow (this.lambda * this.E / (2 * Math.PI), 2) / (Phys.Z0 / Math.PI);
        
        // E должно быть достаточно для уверенного приема
        this.suggest (this.E >= this.Emin, "Emin");
        
        // в ближней зоне и зоне индукции рассчеты могут быть неточными
        this.suggest (this.D > 2 * Math.PI * this.lambda, "Enear");
        
        // защитное отношение между земной и пространственной волнами 8 дБ (Выходец А. Справочник по радиовещанию, с. 76)
        this.suggest (this.time === "day" || 20 * Math.abs (Math.log10 (this.Es) - Math.log10 (this.Eg)) > 8, "Efading");
                      
        Es = [];
        Eg = [];
        Ei = [];
        
        // расчет зависимости E=f(D) и границ зон уверенного приема
        for (D = 1e3; D <= 10000e3; D = Math.pow (D, 1.002)) {
            vEs = fnSkywave (this.lambda, this.P, antenna.fnD, D, this.H);
            vEg = fnEg (this.lambda, this.P, D, antenna.fnD, this.sigma, this.eps);
            
            Theta = fnTheta (D, this.H);
            
            // граница зоны 50%-замираний
            if ((vEg < vEs * 2) && this.dn === undefined) {
                this.dn = D;
            }

            // граница зоны уверенного приема
            if (vEg < this.Emin && this.dd === undefined) {
                this.dd = D;
            }
            
            Es.push ([D, vEs]);
            Eg.push ([D, vEg]);
            
            // учитываем разность хода волн
            Ei.push ([D, fnInterference (vEg, vEs, this.lambda, D, fnR (D, this.H), 0)]);                
        }

        this.plot (
            [Plots.dataA (Eg, "Земная волна"), 
             Plots.dataB (Es, "Ионосферная волна (ночь)"),
             Plots.dataC (Ei, "Суперпозиция волн (ночь)")
            ], {
                xaxis: Plots.logD (),            
                yaxis: Plots.logE ()
            }, 
        1);
        
        // расчет диаграммы направленности                
        F = [];
        for (Theta = -90; Theta < 90; Theta += 0.1) {
            phi = Theta / 180 * Math.PI;
            rho = antenna.fnD (phi) / antenna.D;

            F.push ([rho * Math.sin (phi), rho * Math.cos (phi)]);
        }

        this.plot (
            [{
                data : F, 
                label: "D=" + (10 * Math.log10 (antenna.D)).toPrecision (3) + " dBi",
                color : "#00F", 
                shadowSize : 0
            }], {
                xaxis: {
                    color : "#000000",
                    min : -1,
                    max : 1,
                    ticks : []
                },
            
                yaxis: {
                    color : "#000000",
                    min : 0,
                    max : 1, 
                    ticks : []
                }
                },
            0);
    });
}

$ (document).ready (function () {"use strict";
    Calc.init (crystal);
});
