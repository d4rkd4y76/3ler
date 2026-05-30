/* Düello oyun ekranı — +10 uçuş, anlık doğru/yanlış geri bildirimi */
(function () {
  if (window.__novaDuelGameFxInstalled) return;
  window.__novaDuelGameFxInstalled = true;

  window.novaDuelPointsPerCorrect = 10;

  function fitImageInDuelBox(img, container) {
    if (!img || !container) return;
    var run = function () {
      if (!img.naturalWidth || !img.naturalHeight) return;
      var boxW = container.clientWidth - 28;
      if (boxW < 80) boxW = container.clientWidth - 12;
      var availH = Math.max(120, window.innerHeight - 340);
      if (window.innerHeight <= 640) availH = Math.max(100, window.innerHeight - 300);
      var ratio = img.naturalWidth / img.naturalHeight;
      var maxH = Math.min(availH * 0.58, 340);
      var maxW = boxW;
      var h = maxH;
      var w = h * ratio;
      if (w > maxW) {
        w = maxW;
        h = w / ratio;
      }
      img.style.maxWidth = Math.round(w) + 'px';
      img.style.maxHeight = Math.round(h) + 'px';
      img.style.width = 'auto';
      img.style.height = 'auto';
    };
    if (img.complete) requestAnimationFrame(run);
    else img.addEventListener('load', function () {
      requestAnimationFrame(run);
    }, { once: true });
  }

  window.ndgFitDuelQuestionMedia = function ndgFitDuelQuestionMedia(container) {
    if (!container) return;
    var imgs = container.querySelectorAll('.question-image, .question-info-image');
    for (var i = 0; i < imgs.length; i++) {
      fitImageInDuelBox(imgs[i], container);
    }
  };

  if (!window.__ndgMediaResizeBound) {
    window.__ndgMediaResizeBound = true;
    window.addEventListener(
      'resize',
      function () {
        if (!document.body.classList.contains('nova-duel-game-open')) return;
        var c = document.querySelector('#duel-game-screen .question-container');
        if (c) window.ndgFitDuelQuestionMedia(c);
      },
      { passive: true }
    );
  }

  function getSideForStudent(studentId, duelData) {
    if (!duelData || !duelData.inviter) return 'left';
    return String(duelData.inviter.studentId) === String(studentId) ? 'left' : 'right';
  }

  function prefersReducedMotion() {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (_) {
      return false;
    }
  }

  function pulseScoreTarget(target) {
    if (!target) return;
    target.classList.remove('ndg-score-pulse');
    void target.offsetWidth;
    target.classList.add('ndg-score-pulse');
    setTimeout(function () {
      target.classList.remove('ndg-score-pulse');
    }, 650);
  }

  function spawnSparks(x, y, count) {
    var n = count || 8;
    for (var i = 0; i < n; i++) {
      var spark = document.createElement('span');
      spark.className = 'ndg-fly-spark';
      spark.style.left = x + 'px';
      spark.style.top = y + 'px';
      var ang = (Math.PI * 2 * i) / n + Math.random() * 0.4;
      var dist = 28 + Math.random() * 36;
      spark.style.setProperty('--sx', Math.cos(ang) * dist + 'px');
      spark.style.setProperty('--sy', Math.sin(ang) * dist + 'px');
      document.body.appendChild(spark);
      setTimeout(function () {
        try {
          spark.remove();
        } catch (_) {}
      }, 720);
    }
  }

  window.novaDuelFlyPlusOne = function novaDuelFlyPlusOne(side, isCorrect, opts) {
    opts = opts || {};
    try {
      var points = window.NovaDuelPointsPerCorrect || 10;
      var countId = side === 'right' ? 'novaRightCount' : 'novaLeftCount';
      var target = document.getElementById(countId);
      if (!target) return;

      var startX = window.innerWidth * 0.5;
      var startY = window.innerHeight * 0.52;
      if (opts.sourceEl && opts.sourceEl.getBoundingClientRect) {
        var sr = opts.sourceEl.getBoundingClientRect();
        startX = sr.left + sr.width / 2;
        startY = sr.top + sr.height / 2;
      }

      var tr = target.getBoundingClientRect();
      var endX = tr.left + tr.width / 2;
      var endY = tr.top + tr.height / 2;
      var dx = endX - startX;
      var dy = endY - startY;

      var fly = document.createElement('div');
      fly.className = 'ndg-fly-plus' + (isCorrect ? '' : ' ndg-fly-wrong');
      fly.innerHTML =
        '<span class="ndg-fly-plus__ring" aria-hidden="true"></span>' +
        '<span class="ndg-fly-plus__num">' +
        (isCorrect ? '+' + points : '✕') +
        '</span>';
      fly.style.left = startX + 'px';
      fly.style.top = startY + 'px';
      document.body.appendChild(fly);

      if (prefersReducedMotion()) {
        fly.style.transform = 'translate(-50%, -50%) scale(1)';
        fly.style.opacity = '1';
        pulseScoreTarget(target);
        setTimeout(function () {
          try {
            fly.remove();
          } catch (_) {}
        }, 420);
        return;
      }

      requestAnimationFrame(function () {
        fly.classList.add('ndg-fly-go');
        var anim = fly.animate(
          [
            {
              transform: 'translate(-50%, -50%) scale(0.2)',
              opacity: 0,
              filter: 'blur(4px)',
            },
            {
              transform: 'translate(-50%, -50%) scale(1.35)',
              opacity: 1,
              filter: 'blur(0px)',
              offset: 0.12,
            },
            {
              transform:
                'translate(calc(-50% + ' +
                dx * 0.55 +
                'px), calc(-50% + ' +
                dy * 0.55 +
                'px)) scale(1.08)',
              opacity: 1,
              offset: 0.55,
            },
            {
              transform:
                'translate(calc(-50% + ' +
                dx +
                'px), calc(-50% + ' +
                dy +
                'px)) scale(0.72)',
              opacity: 0.85,
              offset: 0.88,
            },
            {
              transform:
                'translate(calc(-50% + ' +
                dx +
                'px), calc(-50% + ' +
                dy +
                'px)) scale(0.35)',
              opacity: 0,
            },
          ],
          {
            duration: 920,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            fill: 'forwards',
          }
        );

        spawnSparks(startX, startY, window.matchMedia('(pointer: coarse)').matches ? 10 : 14);

        setTimeout(function () {
          pulseScoreTarget(target);
        }, 760);

        if (anim && anim.finished) {
          anim.finished.then(function () {
            try {
              fly.remove();
            } catch (_) {}
          });
        } else {
          setTimeout(function () {
            try {
              fly.remove();
            } catch (_) {}
          }, 980);
        }
      });
    } catch (e) {
      console.warn('novaDuelFlyPlusOne', e);
    }
  };

  function findChosenButton(chosenText, studentId) {
    var buttons = document.querySelectorAll('#duel-options-container .option-button');
    var want = String(chosenText || '').trim();
    if (want) {
      for (var i = 0; i < buttons.length; i++) {
        if (String(buttons[i].textContent || '').trim() === want) return buttons[i];
      }
    }
    return document.querySelector(
      '#duel-options-container .option-button.option-chosen'
    );
  }

  window.novaDuelFeedbackForAnswer = function novaDuelFeedbackForAnswer(
    studentId,
    isCorrect,
    duelData,
    chosenText
  ) {
    var side = getSideForStudent(studentId, duelData);
    var myId = window.selectedStudent && window.selectedStudent.studentId;
    var chosen = findChosenButton(chosenText, studentId);
    if (String(studentId) === String(myId) && chosen) {
      chosen.classList.add(isCorrect ? 'ndg-pick-correct' : 'ndg-pick-wrong');
    }
    if (isCorrect) {
      window.novaDuelFlyPlusOne(side, true, { sourceEl: chosen });
    }
  };

  window.novaBuildDuelFinalPremium = function novaBuildDuelFinalPremium(opts) {
    opts = opts || {};
    var d = opts.ddata || {};
    var inv = d.inviter || {};
    var invt = d.invited || {};
    var invScore = Number(opts.invScore || 0);
    var inScore = Number(opts.inScore || 0);
    var winnerId = opts.winnerId || null;
    var tie = !winnerId;
    var invWin = !!(winnerId && String(winnerId) === String(inv.studentId));
    var inWin = !!(winnerId && String(winnerId) === String(invt.studentId));
    var localWon = !!opts.localWon;
    var localLost = !!opts.localLost;
    var renderName =
      typeof window.renderNameWithFrame === 'function'
        ? window.renderNameWithFrame
        : function (n) {
            return String(n || '');
          };

    var headline = tie
      ? 'BERABERE'
      : localWon
        ? 'ZAFER!'
        : localLost
          ? 'YENİLGİ'
          : 'MAÇ BİTTİ';
    var headClass = tie ? 'tie' : localWon ? 'win' : localLost ? 'lose' : 'tie';

    function esc(s) {
      return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/"/g, '&quot;');
    }

    function playerCard(p, side) {
      var isWin = side === 'inv' ? invWin : inWin;
      var isLose = !!(winnerId && !isWin && !tie);
      var role = tie ? 'Berabere' : isWin ? 'Kazanan' : isLose ? 'Kaybeden' : '—';
      var cls = tie ? 'tie' : isWin ? 'winner' : 'loser';
      var photo = p.photo || 'https://via.placeholder.com/80';
      var score = side === 'inv' ? invScore : inScore;
      return (
        '<div class="ndg-final-player ' +
        cls +
        '">' +
        '<img src="' +
        esc(photo) +
        '" alt=""/>' +
        '<div class="ndg-fp-name">' +
        renderName(p.name, p.nameFrame || 'default') +
        '</div>' +
        '<div class="ndg-fp-role">' +
        role +
        '</div>' +
        '<div class="ndg-fp-score">' +
        score +
        '</div>' +
        '<div class="ndg-fp-score-lbl">puan</div></div>'
      );
    }

    var root = document.createElement('div');
    root.className = 'ndg-final-premium';
    root.innerHTML =
      '<div class="ndg-final-headline ' +
      headClass +
      '">' +
      headline +
      '</div>' +
      '<div class="ndg-final-board">' +
      playerCard(inv, 'inv') +
      '<div class="ndg-final-vs">VS</div>' +
      playerCard(invt, 'in') +
      '</div>' +
      '<section class="nova-duel-report" id="nova_duel_local_delta"></section>';
    return root;
  };
})();
