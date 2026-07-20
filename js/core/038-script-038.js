(function(){
      function ready(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

      function countUp(el, target){
        target = Math.max(0, parseInt(target||0,10));
        const start = 0; const dur = 700;
        const t0 = performance.now();
        try{ el.style.animation = 'novaCount .4s ease'; }catch(_){}
        function tick(now){
          const p = Math.min(1, (now - t0)/dur);
          const val = Math.round(start + (target-start)*p);
          el.textContent = String(val);
          if(p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }

      function buildResultUI(){
        const root = document.getElementById('duel-final-container');
        if(!root || root.dataset.enhanced) return;
        if (root.querySelector('.nova-duel-epic-result, .ndg-final-premium')) {
          root.dataset.enhanced = 'premium';
          return;
        }
        // pull data from existing DOM (non-breaking)
        const invBox = document.getElementById('duel-player-inviter-score');
        const inBox  = document.getElementById('duel-player-invited-score');
        if(!invBox || !inBox) return;

        const inviter = {
          name: (document.getElementById('duel-player-inviter-name')?.dataset?.playerNameRaw) || (document.getElementById('duel-player-inviter-name')||{}).textContent || 'Oyuncu 1',
          nameFrame: (document.getElementById('duel-player-inviter-name')?.dataset?.nameFrame) || 'default',
          avatarFrame: (document.getElementById('duel-player-inviter-photo')?.dataset?.avatarFrame) || 'default',
          photo: (document.getElementById('duel-player-inviter-photo')||{}).src || '',
          score: parseInt((document.getElementById('inviter-correct-count')||{}).textContent||'0', 10)
        };
        const invited = {
          name: (document.getElementById('duel-player-invited-name')?.dataset?.playerNameRaw) || (document.getElementById('duel-player-invited-name')||{}).textContent || 'Oyuncu 2',
          nameFrame: (document.getElementById('duel-player-invited-name')?.dataset?.nameFrame) || 'default',
          avatarFrame: (document.getElementById('duel-player-invited-photo')?.dataset?.avatarFrame) || 'default',
          photo: (document.getElementById('duel-player-invited-photo')||{}).src || '',
          score: parseInt((document.getElementById('invited-correct-count')||{}).textContent||'0', 10)
        };

        const inviterWin = invBox.classList.contains('winner');
        const invitedWin = inBox.classList.contains('winner');
        const isTie = !inviterWin && !invitedWin;

        const winner = inviterWin ? inviter : (invitedWin ? invited : null);
        const loser  = inviterWin ? invited : inviter;

        // keep original message & back button if present
        const backBtn = document.getElementById('duel-final-back-button');
        const msgEl = document.getElementById('winner-message');
        if(msgEl) msgEl.style.display = 'none'; // we'll show a richer header

        // Build card
        const wrap = document.createElement('div');
        wrap.className = 'nova-duel-result';

        const card = document.createElement('div');
        card.className = 'nova-result-card';

        // Hero section
        const hero = document.createElement('div');
        hero.className = 'nova-hero';

        const crown = document.createElement('div');
        crown.className = 'crown';
        crown.textContent = isTie ? '🤝' : '👑';

        const title = document.createElement('div');
        title.className = 'winner-name';
        title.innerHTML = isTie ? 'Berabere!' : (winner ? renderNameWithFrame(winner.name, winner.nameFrame || 'default') : 'Kazanan');

        const subtitle = document.createElement('div');
        subtitle.className = 'subtitle';
        subtitle.textContent = isTie ? 'Harika mücadele!'
          : 'Tebrikler! Müthiş bir galibiyet.';

        hero.appendChild(crown);
        hero.appendChild(title);
        hero.appendChild(subtitle);

        // Scoreboard
        const board = document.createElement('div');
        board.className = 'nova-scoreboard';

        function playerCard(p, isWinner){
          const el = document.createElement('div');
          el.className = 'nova-player ' + (isTie ? 'tie' : (isWinner ? 'winner' : 'loser'));
          el.innerHTML = `
            <img class="nova-avatar" src="${p.photo||''}" alt="Oyuncu" data-avatar-frame="${p.avatarFrame||'default'}"/>
            <div class="nova-names">
              <div class="nm">${renderNameWithFrame(p.name, p.nameFrame || 'default')}</div>
              <div class="rk">${isTie ? 'Berabere' : (isWinner ? 'Kazanan' : 'Rakip')}</div>
            </div>
            <div class="nova-score">0</div>
          `;
          try{
            applyAvatarFrameToImage(el.querySelector('.nova-avatar'), p.avatarFrame || 'default');
          }catch(_){}
          return el;
        }

        const left  = playerCard(inviter, inviterWin && !isTie);
        const right = playerCard(invited, invitedWin && !isTie);
        const vs = document.createElement('div'); vs.className = 'nova-vs'; vs.textContent = 'VS';

        board.appendChild(left);
        board.appendChild(vs);
        board.appendChild(right);

        // Actions
        const actions = document.createElement('div');
        actions.className = 'nova-actions';

        // Reuse existing back button node to keep its event listener
        if(backBtn){
          backBtn.classList.add('nova-btn','secondary');
          backBtn.textContent = 'Ana Menü';
          actions.appendChild(backBtn);
        }

        // Append assembled nodes
        card.appendChild(hero);
        card.appendChild(board);
        card.appendChild(actions);
        wrap.appendChild(card);
        root.prepend(wrap);
        root.dataset.enhanced = '1';

        // Animate counts up
        countUp(left.querySelector('.nova-score'), inviter.score);
        countUp(right.querySelector('.nova-score'), invited.score);
      }

      function watchFinal(){
        const final = document.getElementById('duel-final-container');
        if(!final) return;
        const runIfVisible = () => {
          const shown = getComputedStyle(final).display !== 'none';
          if(shown && !final.dataset.enhanced){
            // Slight delay to allow classes to be applied & confetti to fire
            setTimeout(buildResultUI, 40);
          }
        };
        // Observe style/class changes
        const obs = new MutationObserver(runIfVisible);
        obs.observe(final, { attributes:true, attributeFilter:['style','class'] });
        // Also run on load in case it's already visible
        runIfVisible();
      }

      ready(watchFinal);
    })();
