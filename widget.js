window.FreshCap = {
  render: function(el, opts) {
    const root = document.querySelector(el);
    const container = document.createElement("div");
    container.className = "freshcap-container";
    container.innerHTML = `
      <div class="freshcap-checkbox"></div>
      <div class="freshcap-label">I'm not a robot</div>
      <div class="freshcap-badge">FreshCap</div>
      <div class="freshcap-popup"></div>
    `;
    root.appendChild(container);

    const checkbox = container.querySelector(".freshcap-checkbox");
    const popup = container.querySelector(".freshcap-popup");
    let chal = null;

    const verifiedIcon = `
      <svg class="freshcap-verified-icon" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
    `;

    checkbox.addEventListener("click", () => {
      if (!chal) {
        fetch("/v1/challenge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ site_key: opts.siteKey })
        })
        .then(r => r.json())
        .then(data => {
          chal = data;
          popup.innerHTML = "";
          popup.classList.add("active");

          if (chal.type === "slider") {
            popup.innerHTML = `
              <div class="freshcap-hint">${chal.challenge_payload.hint}</div>
              <input type="range" min="0" max="100" value="0" class="freshcap-range">
              <div class="freshcap-status">Slide to verify</div>
            `;
            const range = popup.querySelector(".freshcap-range");
            const status = popup.querySelector(".freshcap-status");

            range.addEventListener("input", () => {
              range.style.background = `linear-gradient(to right, #6366f1 ${range.value}%, #374151 ${range.value}%)`;
            });

            range.addEventListener("change", () => {
              fetch("/v1/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  site_key: opts.siteKey,
                  challenge_id: chal.challenge_id,
                  response: { position: parseInt(range.value) }
                })
              }).then(r => r.json()).then(res => {
                if (res.success) {
                  checkbox.classList.add("checked");
                  checkbox.innerHTML = verifiedIcon;
                  popup.classList.remove("active");
                  status.innerText = "Verified";
                  status.classList.add("freshcap-success");
                  status.classList.add("pop-up");
                  window.parent.postMessage({ freshcapToken: res.token }, "*");
                } else {
                  status.innerText = "Try again";
                  range.value = 0;
                  range.style.background = "";
                }
              });
            });
          }

          if (chal.type === "question") {
            popup.innerHTML = `
              <div class="freshcap-question">${chal.challenge_payload.question}</div>
              <input type="text" class="freshcap-answer" placeholder="Your answer...">
              <button class="freshcap-submit">Verify</button>
              <div class="freshcap-status">Enter your answer above</div>
            `;
            const answerInput = popup.querySelector(".freshcap-answer");
            const status = popup.querySelector(".freshcap-status");

            popup.querySelector(".freshcap-submit").addEventListener("click", () => {
              fetch("/v1/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  site_key: opts.siteKey,
                  challenge_id: chal.challenge_id,
                  response: { answer: answerInput.value }
                })
              }).then(r => r.json()).then(res => {
                if (res.success) {
                  checkbox.classList.add("checked");
                  checkbox.innerHTML = verifiedIcon;
                  popup.classList.remove("active");
                  status.innerText = "Verified";
                  status.classList.add("freshcap-success");
                  status.classList.add("pop-up");
                  window.parent.postMessage({ freshcapToken: res.token }, "*");
                } else {
                  status.innerText = "Wrong, try again";
                  answerInput.value = "";
                  answerInput.classList.add("shake");
                  setTimeout(() => answerInput.classList.remove("shake"), 500);
                }
              });
            });
          }
        });
      } else {
        popup.classList.toggle("active");
      }
    });
  }
};
