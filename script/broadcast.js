/*jslint plusplus: true */
/*global Phys: true, Calc: true, Complex: true */
/*global IdealIsotropicRadiator: true, IdealMonopoleRadiator: true, MonopoleRadiator: true */
/*global Grounds: true, Plots: true */

// TODO: Конец зоны 50% замирания
// TODO: Зона 100% замирания
// TODO: Отсортировать по важности влияния
// TODO: Отдельный тип поверхности в конце трассы
// TODO: Два типа поверхности, в конце и начале, средине
// TODO: Выбор проводимости земной по карте
// TODO: Антены мощных СВ и ДВ радиостанций
// TODO: Антенна Александерсена
// TODO: Поправки для ионосферной волны
// TODO: Поправки для кривизны земной поверхности
// TODO: Поправки для высоты над уровнем моря
// TODO: Поправки для рельефа и т.п.
// TODO: Произвольные антенны
// TODO: Многоскачковое распространение
// TODO: Данные ITU-R
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
            ground : ['mountains', 'polar ice', 'forest', 'sandy soil', 'dry soil', 'wet soil', 'fresh water', 'sea water', '!'],
            ground_sigma : [1e-3],
            ground_eps : [1e0],
            time : ['day', 'night'],
            antenna: ['.', 'D1.5',  '0.25', '0.53' , '0.65', 'T', '3T'],
            CCIR : ['n', 'y'],
            CCIR_W : [],
            CCIR_T : [-40, -30, -20, -10, -5, -3, -2, -1, 0, 0.5, 1, 1.5, -4, -10, -20, -40, -60],
            CCIR_M : [50, 55, 60, 65, 70, 75]
        },
        output : {
            lambda : [1e0, 3],
            sigma : [1e+0, 1, "exp"],
            eps : [1e+0, 2],
            Pi : [1e0, 1, "exp"],
            h : [1e0, 3],
            E0 : [1e-3, 2],
            Es : [1e-3, 2],
            Eg : [1e-3, 2],
            Fo : [1e0, 2, "exp"],
            Emin : [1e-3, 1],
            phi : [1e0, 2],
            Theta : [1e0, 2],
            hs : [1e3, 2],
            E : [1e-3, 1],
            Ga : [1e-1, 2],
            Da : [1e-1, 2],
            KCCIR : [1e-1, 2],
            etaa : [1e-2, 2],
            dfa : [1e3, 2],
            D1 : [1e3, 2],
            dd : [1e3, 2],
            dn : [1e3, 2]
        }
    }, function () {       
        // проверка входных значений       
        this.check (this.f >= 150e3 && this.f <= 2e6, "f");
        this.check (this.P > 0 && this.P <= 10e6, "P");
        this.check (this.D > 1 && this.D <= 10e6, "D");
        this.check (this.time === 'day' || (this.H >= 90e3 && this.H <= 120e3), "H");

        // длина волны
        this.lambda = Phys.C / this.f;
        
        if (this.ground !== '!') {
            var ground = Grounds [this.ground];
            
            this.sigma = ground.sigma;
            this.eps = ground.eps;        
        } else {
            this.check (this.ground_sigma > 0 && this.ground_sigma < 10, "ground_sigma");
            this.check (this.ground_eps >= 1 && this.ground_eps <= 100, "ground_eps");
            
            this.sigma = this.ground_sigma;
            this.eps = this.ground_eps;
        }
                
        // антенна передатчика
        var antenna;
        switch (this.antenna) {
            case '.':
                antenna = new IdealIsotropicRadiator ().fn (this.lambda);
                break;

            case 'T':
                antenna = new OptimalLoadedMonopoleRadiator (this.lambda, Materials ['Zn'].g, Grounds['dry soil'].sigma, Grounds['dry soil'].eps).fn (this.lambda);
                break;

            case 'D1.5':
                antenna = new IdealMonopoleRadiator (this.lambda * 0.01, 0.1).fn (this.lambda);
                antenna.eta = 0.5;
                break;
                
            case '3T':
                // FIXME: 
                antenna = new IdealIsotropicRadiator ().fn (this.lambda);
                break;                
                
            // TODO: Второй параметр. Бесконечно тонкая. Использовать реальное значение?
            case '0.25':
                // antenna = new IdealMonopoleRadiator (this.lambda * 0.25, 0.25).fn (this.lambda); 
                antenna = new OptimalMonopoleRadiator (0.25, this.lambda, Materials ['Zn'].g, Grounds['dry soil'].sigma, Grounds['dry soil'].eps).fn (this.lambda);
                break;
                
            case '0.53':
                // antenna = new IdealMonopoleRadiator (this.lambda * 0.53, 0.25).fn (this.lambda);               
                antenna = new OptimalMonopoleRadiator (0.53, this.lambda, Materials ['Zn'].g, Grounds['dry soil'].sigma, Grounds['dry soil'].eps).fn (this.lambda);
                break;
                
            case '0.65':
                // antenna = new IdealMonopoleRadiator (this.lambda * 0.64, 0.25).fn (this.lambda);
                antenna = new OptimalMonopoleRadiator (0.64, this.lambda, Materials ['Zn'].g, Grounds['dry soil'].sigma, Grounds['dry soil'].eps).fn (this.lambda);
                break;
        }

        this.h = antenna.h;
        
        // Надененко, с.280
        this.suggest (this.h <= 250, "h");

        this.dfa = this.f / (antenna.Q + Math.abs (antenna.Z.y / antenna.Z.x));
        this.etaa = antenna.eta;
        this.Da = Math.log10 (antenna.D ());
        this.Ga = Math.log10 (antenna.D () * antenna.eta);
        this.suggest (this.time === "day" || this.antenna !== '0.65', "antenna065");
        
        // напряженность поля для идеальной среды
        function fnE0 (P, d, fnD, eta, Theta) {          
            return Math.sqrt ((Phys.Z0 / Math.PI) / 2 * P * fnD (Theta) * eta) / d;
        }

        // коэффициент затухания поверхностной волны [Гинкин Г.Г. Справочник по радиотехнике 1948, с. 740]
        // формула Зоммерфельда-Шулейкина
        function fnA (lambda, d, sigma, eps) {
            var jeps = Phys.Z0 / (2 * Math.PI) * lambda * sigma;
            var rho = Math.PI * d / lambda * Math.sqrt (Math.pow (eps - 1, 2) + Math.pow (jeps, 2)) / (Math.pow (eps, 2) + Math.pow (jeps, 2));
            
            return (2 + 0.3 * rho) / (2 + rho + 0.6 * Math.pow (rho, 2)) - Math.sqrt (rho / 2) * Math.exp (-5 * rho / 8);
        }

        // рассчет напряженности поля поверхностной волны
        function fnEg (lambda, P, d, fnD, eta, sigma, eps) {
            var E0 = fnE0 (P, d, fnD, eta, Math.PI / 2);
            var A = fnA (lambda, d, sigma, eps);
            
            // компенсируем уже учтенную проводимость моря в коээфициенте ослабления Остина
            var A1 = fnA (lambda, d, 4, 80) * Math.sqrt (2);
            
            var Theta = d / 111e3 / 180 * Math.PI;           
            var kO = Math.exp (-0.0014e-3 * d / Math.pow (lambda * 1e-3, 0.6)) * Math.sqrt (Theta / Math.sin (Theta)) / A1;
            
            return E0 * A * kO;
        }
      
        this.E0 = fnE0 (this.P, this.D, antenna.fnD, antenna.eta, Math.PI / 2);

        this.Theta = this.D / 111e3;
        this.A = fnA (this.lambda, this.D, this.sigma, this.eps);
        this.Eg = fnEg (this.lambda, this.P, this.D, antenna.fnD, antenna.eta, this.sigma, this.eps);
        
        // центральный угол
        this.gamma = this.D / Phys.Re;
        
        // предельная дальность односкачкового распространения
        this.D1 = 2 * Math.acos (Phys.Re / (Phys.Re + this.H)) * Phys.Re;
        // высота шарового сегмента 
        this.hs = Phys.Re * (1 - Math.cos (this.gamma / 2));
        // TODO: Многоскачковое распространение + точный расчет от ионосферы + скольжение волны при углах близких к предельному углу
        this.suggest (this.time === 'day' || this.D < this.D1, "D1");
        
        // угол падения ионосферной волны
        function fnSkywaveTheta (D, H) {
            var gamma = D / (2 * Phys.Re);
            var Theta = Math.atan ((Phys.Re + H) * Math.sin (gamma) / ((Phys.Re + H) * Math.cos (gamma) - Phys.Re));
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
        function fnSkywave (lambda, P, fnD, eta, D, H, sigma, eps, Delta) {
            var Theta = fnSkywaveTheta (D, H);
            // var D1 = 2 * Math.acos (Phys.Re / (Phys.Re + H)) * Phys.Re;
            var k = (Math.sqrt (1 - Math.cos (2 * Theta)) / Math.sqrt (2));
            // 0.010233 - действующее? 0.014472 - амплитудное?                   
            return Delta * k * 0.010233 * Math.sqrt (P * fnD (Theta) * eta) / Math.sqrt (D) * Math.exp (-8.94e-7 * Math.pow (lambda * 1e-3, -0.26) * D);
        }
       
        // зенитный угол ионосферной волны
        var Theta = fnSkywaveTheta (this.D, this.H) / Math.PI * 180;
        
        // угол падения  ионосферной волны
        this.phi = 90 - Theta;
        
        function fnDelta (M, T, W, D) {
            var DJ = {
                50: [[1e6, 0], [2e6, 0.5], [2.5e6, 1], [3.4e6, 2]],
                55: [[1e6, 0], [2e6, 0.5], [2.5e6, 1], [3.4e6, 2]],
                60: [[1e6, 0], [2e6, 0], [2.5e6, 0], [3.4e6, 0.5]],
                65: [[1e6, 0], [2e6, -2], [2.5e6, -3], [3.4e6, -6]],
                70: [[1e6, -0.5], [2e6, -7], [2.5e6, -12], [3.4e6, -22]],
                75: [[1e6, -1], [2e6, -8], [2.5e6, -14], [3.4e6, -25]]
            };

            var r = D <= 1e6 ? 1e6 : D >= 3.4e6 ? 3.4e6 : D;
            
            return Math.interpolate (DJ [M], r) + T - 0.02 * W;        
        };
        
        // поправки CCIR на напряженность поля
        var CCIR = 0;
        if (this.CCIR === 'y') {
            this.check (this.CCIR_W > 0 && this.CCIR_W < 300, "CCIR_W");
 
            CCIR = fnDelta (this.CCIR_M, this.CCIR_T, this.CCIR_W, this.D);
        }
        
        this.KCCIR = CCIR / 10;
        
        // напряженность пространственной волны        
        this.Es = fnSkywave (this.lambda, this.P, antenna.fnD, antenna.eta, this.D, this.H, this.sigma, this.eps, Math.pow (10, CCIR / 20));
       
        // суммарная напряженность поля земной и ионосферной волны
        this.E = (this.time === "day") 
            ? this.Eg // день
            : fnInterference (this.Eg, this.Es, this.lambda, 0, 0, Math.PI); // ночь

        // минимальная напряженность для уверенного приема (Выходец А. Справочник по радиовещанию, с. 76)
        // TODO: Использовать реальные критерии, помеховую обстановку, наличие соедних передатчиков, etc
        this.Emin = 1e-3 * (1e6 / this.f);

        // принимаемая мощность в изотропной идеальной антенне
        this.Pi = Math.pow (this.lambda * this.E / (2 * Math.PI), 2) / (Phys.Z0 / Math.PI);
        
        // E должно быть достаточно для уверенного приема
        this.suggest (this.E >= this.Emin, "Emin");
        
        // в ближней зоне и зоне индукции рассчеты могут быть неточными
        this.suggest (this.D > 2 * Math.PI * this.lambda, "Enear");
        
        // защитное отношение между земной и пространственной волнами 8 дБ (Выходец А. Справочник по радиовещанию, с. 76)
        this.suggest (this.time === "day" || 20 * Math.abs (Math.log10 (this.Es) - Math.log10 (this.Eg)) > 8, "Efading");
                      
        var Es = [];
        var Eg = [];
        var Ei = [];
        
        // расчет зависимости E=f(D) и границ зон уверенного приема
        for (var D = 1e3; D <= 10000e3; D = Math.pow (D, 1.002)) {
            var Delta = (this.CCIR === 'y') ? fnDelta (this.CCIR_M, this.CCIR_T, this.CCIR_W, D) : 0;
            var vEs = fnSkywave (this.lambda, this.P, antenna.fnD, antenna.eta, D, this.H, this.sigma, this.eps, Math.pow (10, Delta / 20));
            var vEg = fnEg (this.lambda, this.P, D, antenna.fnD, antenna.eta, this.sigma, this.eps);
            
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
        
        var data = (this.time === "day")
            ? [Plots.dataC (Eg, "Земная волна")]
            : [ Plots.dataA (Eg, "Земная волна"), 
                Plots.dataB (Es, "Ионосферная волна"),
                Plots.dataC (Ei, "Суперпозиция волн")
              ];
        
        this.plot (data, {
            xaxis: Plots.logD (), 
            yaxis: Plots.logE (),
            
             grid: {
                markings: [{ 
                    yaxis: { 
                        from: this.Emin, 
                        to: this.Emin
                    },
                        
                    color: "#272" 
                }],
                
                markingsLineWidth: 1
            }
        }, 1);
        
        // расчет диаграммы направленности           
        this.plot (Plots.radiationPatternData (antenna.fnD, antenna.D ()), Plots.radiationPatternAxes (), 0);            
    });
}

$ (document).ready (function () {"use strict";
    Calc.init (crystal);
});
