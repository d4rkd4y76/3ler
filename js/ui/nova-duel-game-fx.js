/* Düello oyun ekranı — +1 uçuş, anlık doğru/yanlış geri bildirimi */
(function () {
  if (window.__novaDuelGameFxInstalled) return;
  window.__novaDuelGameFxInstalled = true;

  function getSideForStudent(studentId, duelData) {
    if (!duelData || !duelData.inviter) return 'left';
    return String(duelData.inviter.studentId) === String(studentId) ? 'left' : 'right';
  }

  window.novaDuelFlyPlusOne = function novaDuelFlyPlusOne(side, isCorrect) {
    try {
      var countId = side === 'right' ? 'novaRightCount' : 'novaLeftCount';
      var target = document.getElementById(countId);
      if (!target) return;

      var fly = document.createElement('div');
      fly.className = 'ndg-fly-plus' + (isCorrect ? '' : ' ndg-fly-wrong');
      fly.textContent = isCorrect ? '+1' : '✕';
      document.body.appendChild(fly);

      requestAnimationFrame(function () {
        fly.classList.add('ndg-fly-go');
        var tr = target.getBoundingClientRect();
        var cx = window.innerWidth * 0.5;
        var cy = window.innerHeight * 0.42;
        var dx = tr.left + tr.width / 2 - cx;
        var dy = tr.top + tr.height / 2 - cy;
        fly.style.transform =
          'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px)) scale(1)';
      });

      setTimeout(function () {
        try {
          fly.remove();
        } catch (_) {}
      }, 750);
    } catch (e) {
      console.warn('novaDuelFlyPlusOne', e);
    }
  };

  function findChosenButton(chosenText) {
    var buttons = document.querySelectorAll('#duel-options-container .option-button');
    var want = String(chosenText || '').trim();
    if (!want) {
      return document.querySelector(
        '#duel-options-container .option-button.option-chosen'
      );
    }
    for (var i = 0; i < buttons.length; i++) {
      if (String(buttons[i].textContent || '').trim() === want) return buttons[i];
    }
    return null;
  }

  window.novaDuelFeedbackForAnswer = function novaDuelFeedbackForAnswer(
    studentId,
    isCorrect,
    duelData,
    chosenText
  ) {
    var side = getSideForStudent(studentId, duelData);
    var myId = window.selectedStudent && window.selectedStudent.studentId;
    if (String(studentId) === String(myId)) {
      var chosen = findChosenButton(chosenText);
      if (chosen) {
        chosen.classList.add(isCorrect ? 'ndg-pick-correct' : 'ndg-pick-wrong');
      }
    }
    if (isCorrect) {
      window.novaDuelFlyPlusOne(side, true);
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
        '<div class="ndg-fp-score-lbl">doğru cevap</div></div>'
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
