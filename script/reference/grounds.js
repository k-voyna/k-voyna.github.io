// удельная проводимость почвы [Куликовский А.А. Справочник по радиоэлектронике, т.1, с.253, табл. 6-2]
Grounds = {
    'polar ice' : {
        sigma : 0.00003,
        eps : 3
    },
    'mountains' : {
        sigma : 0.0001,
        eps : 3
    },
    'forest' : {
        sigma : 0.0003,
        eps : 1
    },
    'sandy soil' : {
        sigma : 0.001,
        eps : 3
    },
    'dry soil' : {
        sigma : 0.003,
        eps : 5
    },
    'wet soil' : {
        sigma : 0.01,
        eps : 20
    },
    'fresh water' : {
        sigma : 0.001,
        eps : 80
    },
    'sea water' : {
        sigma : 4,
        eps : 80
    },
    'ideal' : {
        sigma : Infinity,
        eps : 1
    }
};
