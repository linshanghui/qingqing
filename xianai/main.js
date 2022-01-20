function SimpleAudio(context, options) {
      if (!options) {
        options = {};
      }
      this.settings = $.extend({
        container: '.audio-container',
        statusContainer: '.audio-status',
        totalTimeContainer: '.audio-time',
        playingClass: 'playing',
        errorClass:'error'
      }, options);

      if (context instanceof Element) {
        this.context = context;
      } else {
        var contextArray = $(context);
        if (contextArray.length > 0) {
          for (var i = 0; i < contextArray.length; i++) {
            new SimpleAudio(contextArray[i], this.settings);
          }
        }
        return;
      }
      if (this.context && !this.context.isSimpleAudio) {
        var $audio = $(this.context).find('audio');
        this.player = this.context.querySelector('audio');
        this.settings.src = $audio.data('src') || this.settings.src;
        this.settings.type = $audio.data('type') || this.settings.type;

        this.audioList.push(this);
        //初始化
        this.init();
        this.context.isSimpleAudio = true;
      }

    }

    SimpleAudio.prototype = {
      audioList: [],
      init: function () {
        var self = this;
        self.events();
        // 设置src
        self.changeSrc();

      },
      play: function () {
        var self = this;
        //console.log(self.currentStatus);
        if (self.currentStatus === "error") {
          return;
        }
        if (self.currentStatus === "play") {
          self.pause();
          return;
        }
        //暂停所有其他的音频
        for (var i = 0; i < self.audioList.length; i++) {
          if (self.audioList[i] !== self) {
            self.audioList[i].pause();
          }
        }
        self.player.volume = 1.0;
        self.player.play().then(function () {
          // 播放成功
        }, function (error) {
          console && console.error(error);
          $(self.player).trigger('error');
        });
      },
      pause: function () {
        var self = this;
        if (self.currentStatus === "play") {
          self.player.pause();
        }
      },
      events: function () {
        var self = this;
        $(self.player).on('loadedmetadata', function () {
          self.updateTotalTime();
        }).on('canplay', function () {
          // 设置自动播放
          if (self.settings && self.settings.autoplay) {
            self.play();
          }
        }).on('playing', function () {
          self.changeStatus("play");
        }).on('ended', function () {
          self.player.currentTime = 0;
          self.changeStatus("ended");
        }).on('pause', function () {
          self.player.currentTime = 0;
          self.changeStatus("pause");
        }).on('error', function (e) {
          console && console.error(e);
          self.changeStatus("error");
        });

        $(self.context).on('click', function () {
          self.play();
        });
      },
      changeStatus: function (status) {
        this.currentStatus = status;
        this.onChangeStatus && this.onChangeStatus(this.currentStatus);
      },
      //改变音频源
      changeSrc: function () {
        if (this.settings.type && !this.player.canPlayType(this.settings.type)) {
          console && console.error('audio标签不支持'+this.settings.type+'格式');
          $(this.player).trigger('error','audio标签不支持'+this.settings.type+'格式');
          return;
        }
        if(this.settings.src){
          this.currentStatus = '';
          this.player.src = this.settings.src;
        }
      },
      //更新总时间
      updateTotalTime: function () {
        var totalLabel = $(this.context).find(this.settings.totalTimeContainer);
        if (!totalLabel.text()) {
          var time = Math.round(this.player.duration);
          if (isNaN(time)) {
            time = '';
          }
          if (this.settings.updateTotalTime) {
            this.settings.updateTotalTime(time);
          } else {
            totalLabel.text(time + '"');
          }
        }
      },
      onChangeStatus: function (status) {
        var statusElement = $(this.context).find(this.settings.statusContainer);
        if (status === 'play') {
          statusElement.removeClass(this.settings.errorClass).addClass(this.settings.playingClass);
        } else if (status === 'error') {
          statusElement.removeClass(this.settings.playingClass).addClass(this.settings.errorClass);
        } else {
          statusElement.removeClass(this.settings.playingClass).removeClass(this.settings.errorClass);
        }
      }
    };
		if (!window.SimpleAudio) {
      window.SimpleAudio = SimpleAudio;
    }
    new SimpleAudio('.simple-audio');
