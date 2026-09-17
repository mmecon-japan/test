let seminars = [];

fetch("seminars.json")
  .then(res => res.json())
  .then(data => {
    seminars = data;
    renderTags();
    renderSeminars(seminars);
  });

function renderTags() {
  const container = document.getElementById("tag-container");
  const tags = new Set();

  seminars.forEach(s => s.tags.forEach(t => tags.add(t)));

  tags.forEach(tag => {
    const btn = document.createElement("button");
    btn.textContent = tag;
    btn.onclick = () => {
      const filtered = seminars.filter(s => s.tags.includes(tag));
      renderSeminars(filtered);
    };
    container.appendChild(btn);
  });
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
      <p><strong>タグ：</strong>${s.tags.join(", ")}</p>
    `;
    container.appendChild(card);
  });
}
