let seminars = [];
let selectedTags = new Set();

fetch("seminars.json")
  .then(res => res.json())
  .then(data => {
    seminars = data;
    renderTags();
    renderSeminars(seminars);
  });

function renderTags() {
  const container = document.getElementById("tag-container");
  const tagCounts = {};

  seminars.forEach(s => {
    s.tags.forEach(t => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  Object.keys(tagCounts).sort().forEach(tag => {
    const btn = document.createElement("button");
    btn.textContent = `${tag} (${tagCounts[tag]})`;

    btn.onclick = () => {
      if (selectedTags.has(tag)) {
        selectedTags.delete(tag);
        btn.classList.remove("active");
      } else {
        selectedTags.add(tag);
        btn.classList.add("active");
      }
      updateSelectedTags();
      filterSeminars();
    };

    container.appendChild(btn);
  });
}

function updateSelectedTags() {
  const container = document.getElementById("selected-tags");
  container.textContent = "選択中: " + [...selectedTags].join(", ");
}

function filterSeminars() {
  if (selectedTags.size === 0) {
    renderSeminars(seminars);
    return;
  }

  const filtered = seminars.filter(s =>
    [...selectedTags].every(tag => s.tags.includes(tag))
  );

  renderSeminars(filtered);
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
