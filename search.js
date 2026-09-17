let seminars = [];
let selectedTags = new Set();

fetch("seminars.json")
  .then(res => res.json())
  .then(data => {
    seminars = data;
    updateUI(seminars);
  });

function updateUI(currentList) {
  renderTags(currentList);
  renderSeminars(currentList);
}

function renderTags(currentList) {
  const container = document.getElementById("tag-container");
  container.innerHTML = "";

  // 現在表示されている演習からタグを再計算
  const tagCounts = {};
  currentList.forEach(s => {
    s.tags.forEach(t => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  // 件数が 0 のタグは表示しない
  Object.keys(tagCounts)
    .sort()
    .forEach(tag => {
      const btn = document.createElement("button");
      btn.textContent = `${tag} (${tagCounts[tag]})`;

      // 選択状態の反映
      if (selectedTags.has(tag)) {
        btn.classList.add("active");
      }

      btn.onclick = () => {
        if (selectedTags.has(tag)) {
          selectedTags.delete(tag);
        } else {
          selectedTags.add(tag);
        }
        filterSeminars();
      };

      container.appendChild(btn);
    });

  updateSelectedTags();
}

function updateSelectedTags() {
  const container = document.getElementById("selected-tags");
  container.textContent =
    selectedTags.size === 0
      ? "選択中: なし"
      : "選択中: " + [...selectedTags].join(", ");
}

function filterSeminars() {
  let filtered = seminars;

  if (selectedTags.size > 0) {
    filtered = seminars.filter(s =>
      [...selectedTags].every(tag => s.tags.includes(tag))
    );
  }

  updateUI(filtered);
}

function renderSeminars(list) {
  const container = document.getElementById("seminar-list");
  container.innerHTML = "";

  list.forEach(s => {
    const card = document.createElement("div");
    card.className = "seminar-card";
    card.innerHTML = `
      <h3>${s.code} ${s.name}</h3>
      <p><strong>テーマ：</strong>${s.title}</p>
      <p><strong>タイプ：</strong>${s.type}</p>
      <div>
        ${s.tags.map(t => `<span class="tag-pill">${t}</span>`).join("")}
      </div>
    `;
    container.appendChild(card);
  });
}
