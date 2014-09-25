$(document).foundation();

var nyan = (function($) {
    var running = false;

    var init = function() {
        setupEvents();
        resizeHero();
    };

    var setupEvents = function() {
        window.addEventListener('resize', handleResizeHero);
    };

    var resizeHero = function() {
        var w = window,
            d = document,
            e = d.documentElement,
            g = d.getElementsByTagName('body')[0],
            width = w.innerWidth || e.clientWidth || g.clientWidth,
            height = w.innerHeight|| e.clientHeight|| g.clientHeight;

        if(width > 640) {
            $('.hero').css('max-height', height);
            $('.head').css('max-height', height);
        } else {
            $('.hero').removeAttr('style');
            $('.head').removeAttr('style');
        }
    };

    var handleResizeHero = function (e) {
        var self = this;
        if(!running) {
            setInterval(function() {
                self.running = true;
                resizeHero();
                self.running = false;
            }, 17);
        }
    };

    return {
        init: init
    }
}(jQuery));

nyan.init();