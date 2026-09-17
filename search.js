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

  // 演習のフィルタリング（部分一致のタグ検索 ＋ フリーワード検索）
  function getFilteredSeminars() {
    return allSeminars.filter(seminar => {
      // タグの包含関係（部分一致）チェック
      for (const selTag of selectedTags) {
        const selTagLower = selTag.toLowerCase();
        const hasMatchedTag = seminar.tags.some(t => {
          const tLower = t.toLowerCase();
          return tLower.includes(selTagLower) || selTagLower.includes(tLower);
        });
        if (!hasMatchedTag) {
          return false;
        }
      }

      // フリーワード部分一致検索（教員名、研究テーマ、コード、タイプ、タグ、研究内容）
      if (searchQuery) {
        const nameMatch = seminar.name.toLowerCase().includes(searchQuery);
        const titleMatch = seminar.title.toLowerCase().includes(searchQuery);
        const codeMatch = seminar.code.includes(searchQuery);
        const typeMatch = seminar.type.toLowerCase().includes(searchQuery);
        const tagMatch = seminar.tags.some(t => t.toLowerCase().includes(searchQuery));
        const contentMatch = seminar.content && seminar.content.toLowerCase().includes(searchQuery);

        if (!nameMatch && !titleMatch && !codeMatch && !typeMatch && !tagMatch && !contentMatch) {
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
        <div class="card-actions">
          <button class="detail-btn" type="button">詳細を見る <span class="arrow">▼</span></button>
        </div>
        <div class="card-detail" style="display: none;">
          <div class="detail-heading">研究内容</div>
          <p class="detail-body">${escapeHTML(seminar.content || '（研究内容の詳細情報は演習ガイド本編を参照してください）')}</p>
        </div>
      `;

      // タグピルの作成
      const cardTagsContainer = card.querySelector('.card-tags');
      seminar.tags.forEach(tag => {
        let isMatched = false;
        const tagLower = tag.toLowerCase();

        for (const selTag of selectedTags) {
          const selTagLower = selTag.toLowerCase();
          if (tagLower.includes(selTagLower) || selTagLower.includes(tagLower)) {
            isMatched = true;
            break;
          }
        }

        if (searchQuery && tagLower.includes(searchQuery)) {
          isMatched = true;
        }

        const tagPill = document.createElement('span');
        tagPill.className = `tag-pill ${isMatched ? 'matched' : ''}`;
        tagPill.textContent = tag;

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

      // 詳細ボタンのアクション
      const detailBtn = card.querySelector('.detail-btn');
      const cardDetail = card.querySelector('.card-detail');
      const arrow = detailBtn.querySelector('.arrow');

      detailBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = cardDetail.style.display !== 'none';
        if (isOpen) {
          cardDetail.style.display = 'none';
          detailBtn.classList.remove('open');
          arrow.textContent = '▼';
          detailBtn.childNodes[0].textContent = '詳細を見る ';
        } else {
          cardDetail.style.display = 'block';
          detailBtn.classList.add('open');
          arrow.textContent = '▲';
          detailBtn.childNodes[0].textContent = '詳細を閉じる ';
        }
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
