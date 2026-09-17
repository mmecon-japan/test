document.addEventListener('DOMContentLoaded', () => {
  let allSeminars = [];
  const selectedTags = new Set();
  let searchQuery = '';

  const searchBox = document.getElementById('search-box');
  const tagContainer = document.getElementById('tag-container');
  const selectedTagsContainer = document.getElementById('selected-tags');
  const seminarList = document.getElementById('seminar-list');
  const resultCount = document.getElementById('result-count');

  fetch('seminars.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      allSeminars = data;
      initSite();
    })
    .catch(error => {
      console.error('Error loading seminars.json:', error);
      seminarList.innerHTML = '<div class="no-results">データの読み込みに失敗しました。</div>';
    });

  function initSite() {
    searchBox.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      updateView();
    });

    updateView();
  }

  function updateView() {
    const filteredSeminars = getFilteredSeminars();
    renderSelectedTags();
    updateTagContainer(filteredSeminars);
    renderSeminarList(filteredSeminars);
  }

  function getFilteredSeminars() {
    return allSeminars.filter(seminar => {
      for (const tag of selectedTags) {
        if (!seminar.tags.includes(tag)) {
          return false;
        }
      }

      if (searchQuery) {
        const nameMatch = seminar.name.toLowerCase().includes(searchQuery);
        const titleMatch = seminar.title.toLowerCase().includes(searchQuery);
        const codeMatch = seminar.code.includes(searchQuery);
        const typeMatch = seminar.type.toLowerCase().includes(searchQuery);
        const tagMatch = seminar.tags.some(t => t.toLowerCase().includes(searchQuery));

        if (!nameMatch && !titleMatch && !codeMatch && !typeMatch && !tagMatch) {
          return false;
        }
      }

      return true;
    });
  }

  function renderSelectedTags() {
    selectedTagsContainer.innerHTML = '';
    if (selectedTags.size === 0) return;

    selectedTags.forEach(tag => {
      const tagItem = document.createElement('div');
      tagItem.className = 'selected-tag-item';
      tagItem.innerHTML = `<span>${escapeHTML(tag)}</span> <span class="remove-btn">&times;</span>`;
      tagItem.addEventListener('click', () => {
        selectedTags.delete(tag);
        updateView();
      });
      selectedTagsContainer.appendChild(tagItem);
    });

    const clearAllBtn = document.createElement('button');
    clearAllBtn.className = 'clear-all-btn';
    clearAllBtn.textContent = '条件をクリア';
    clearAllBtn.addEventListener('click', () => {
      selectedTags.clear();
      searchQuery = '';
      searchBox.value = '';
      updateView();
    });
    selectedTagsContainer.appendChild(clearAllBtn);
  }

  function updateTagContainer(filteredSeminars) {
    const tagCounts = new Map();

    filteredSeminars.forEach(seminar => {
      seminar.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    const availableTags = new Set([...tagCounts.keys(), ...selectedTags]);

    const sortedTags = Array.from(availableTags).sort((a, b) => {
      const countA = tagCounts.get(a) || 0;
      const countB = tagCounts.get(b) || 0;
      if (countB !== countA) {
        return countB - countA;
      }
      return a.localeCompare(b, 'ja');
    });

    tagContainer.innerHTML = '';

    sortedTags.forEach(tag => {
      const count = tagCounts.get(tag) || 0;

      if (count === 0 && !selectedTags.has(tag)) {
        return;
      }

      const button = document.createElement('button');
      button.className = 'tag-btn';
      if (selectedTags.has(tag)) {
        button.classList.add('active');
      }

      button.innerHTML = `${escapeHTML(tag)} <span class="count">(${count})</span>`;

      button.addEventListener('click', () => {
        if (selectedTags.has(tag)) {
          selectedTags.delete(tag);
        } else {
          selectedTags.add(tag);
        }
        updateView();
      });

      tagContainer.appendChild(button);
    });
  }

  function renderSeminarList(seminars) {
    resultCount.textContent = `全 ${seminars.length} 件`;
    seminarList.innerHTML = '';

    if (seminars.length === 0) {
      seminarList.innerHTML = '<div class="no-results">条件に一致する演習が見つかりませんでした。検索条件を変更してください。</div>';
      return;
    }

    seminars.forEach(seminar => {
      const card = document.createElement('div');
      card.className = 'seminar-card';

      const typeClass = seminar.type.includes('2年半') ? 'type-2half' : 'type-2year';

      card.innerHTML = `
        <div class="card-header">
          <span class="seminar-code">コード: ${escapeHTML(seminar.code)}</span>
          <span class="seminar-type ${typeClass}">${escapeHTML(seminar.type)}</span>
        </div>
        <div class="seminar-name">${escapeHTML(seminar.name)} 演習</div>
        <div class="seminar-title">${escapeHTML(seminar.title)}</div>
        <div class="card-tags"></div>
      `;

      const cardTagsContainer = card.querySelector('.card-tags');

      seminar.tags.forEach(tag => {
        const isSelected = selectedTags.has(tag);
        const isSearchMatched = searchQuery && tag.toLowerCase().includes(searchQuery);

        const tagPill = document.createElement('span');
        tagPill.className = `tag-pill ${(isSelected || isSearchMatched) ? 'matched' : ''}`;
        tagPill.textContent = tag;

        // ゼミカードのタグをクリックでトグル選択
        tagPill.addEventListener('click', (e) => {
          e.stopPropagation();
          if (selectedTags.has(tag)) {
            selectedTags.delete(tag);
          } else {
            selectedTags.add(tag);
          }
          updateView();
        });

        cardTagsContainer.appendChild(tagPill);
      });

      seminarList.appendChild(card);
    });
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
});
