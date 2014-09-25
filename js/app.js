$(document).foundation();

nyan = function() {
    var resizeHero = function() {
        var w = window,
            d = document,
            e = d.documentElement,
            g = d.getElementsByTagName('body')[0],
            height = w.innerHeight|| e.clientHeight|| g.clientHeight;
        console.log(height);
        $('.hero').css('max-height', height);
        $('.head').css('max-height', height);
    };

    var setupEvents = function() {
        window.addEventListener('resize', resizeHero);
    }

    var init = function() {
        resizeHero();
        setupEvents();
    };

    return{
        init:init
    }
}();

nyan.init();