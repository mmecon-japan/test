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
      searchQuery = e.target.value.trim();
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

  // 表記ゆれ・記号吸収の正規化
  function normalizeText(str) {
    if (!str) return '';
    return str.toLowerCase()
      .replace(/[\s　・,．.・、:：;；\-_―ー]/g, '');
  }

  // 方向性のある包含関係判定 (seminarTagがtargetTagを含むか)
  // 例: selectedTag="社会" のとき seminarTag="国際化社会" は "国際化社会".includes("社会") で true
  // 例: selectedTag="国際化社会" のとき seminarTag="社会" は "社会".includes("国際化社会") で false
  function isTagMatched(seminarTag, targetTag) {
    const normSem = normalizeText(seminarTag);
    const normTgt = normalizeText(targetTag);
    if (!normSem || !normTgt) return false;
    return normSem.includes(normTgt);
  }

  function getFilteredSeminars() {
    return allSeminars.filter(seminar => {
      // 選択中タグの方向性包含関係AND検索
      for (const selectedTag of selectedTags) {
        const hasMatch = seminar.tags.some(semTag => isTagMatched(semTag, selectedTag));
        if (!hasMatch) {
          return false;
        }
      }

      // フリーワード検索
      if (searchQuery) {
        const normQuery = normalizeText(searchQuery);
        const nameMatch = normalizeText(seminar.name).includes(normQuery);
        const titleMatch = normalizeText(seminar.title).includes(normQuery);
        const codeMatch = seminar.code.includes(searchQuery);
        const typeMatch = seminar.type.includes(searchQuery);
        const tagMatch = seminar.tags.some(t => normalizeText(t).includes(normQuery));
        const contentMatch = normalizeText(seminar.content).includes(normQuery);

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
    const candidateTagsMap = new Map();

    allSeminars.forEach(seminar => {
      seminar.tags.forEach(tag => {
        if (!candidateTagsMap.has(tag)) {
          candidateTagsMap.set(tag, tag);
        }
      });
    });

    const candidateTags = Array.from(candidateTagsMap.keys());
    const tagCounts = new Map();

    candidateTags.forEach(candidateTag => {
      let count = 0;
      filteredSeminars.forEach(seminar => {
        const hasMatch = seminar.tags.some(semTag => isTagMatched(semTag, candidateTag));
        if (hasMatch) {
          count++;
        }
      });
      tagCounts.set(candidateTag, count);
    });

    const availableTags = candidateTags.filter(tag => {
      const count = tagCounts.get(tag) || 0;
      return count > 0 || selectedTags.has(tag);
    });

    const sortedTags = availableTags.sort((a, b) => {
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
        <div class="card-action">
          <button class="detail-btn">詳細を見る ▼</button>
        </div>
        <div class="card-detail-content" style="display: none;">
          <div class="detail-section-title">【研究内容】</div>
          <div class="detail-text">${escapeHTML(seminar.content || '研究内容の詳細は演習ガイド本文をご確認ください。')}</div>
        </div>
      `;

      const detailBtn = card.querySelector('.detail-btn');
      const detailContent = card.querySelector('.card-detail-content');

      detailBtn.addEventListener('click', () => {
        const isHidden = detailContent.style.display === 'none';
        if (isHidden) {
          detailContent.style.display = 'block';
          detailBtn.textContent = '詳細を閉じる ▲';
        } else {
          detailContent.style.display = 'none';
          detailBtn.textContent = '詳細を見る ▼';
        }
      });

      const cardTagsContainer = card.querySelector('.card-tags');

      seminar.tags.forEach(tag => {
        let isMatched = false;
        for (const selTag of selectedTags) {
          if (isTagMatched(tag, selTag)) {
            isMatched = true;
            break;
          }
        }

        if (searchQuery && normalizeText(tag).includes(normalizeText(searchQuery))) {
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
