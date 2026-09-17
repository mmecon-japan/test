document.addEventListener('DOMContentLoaded', () => {
  let allSeminars = [];
  const selectedTags = new Set();
  let searchQuery = '';

  const searchBox = document.getElementById('search-box');
  const tagContainer = document.getElementById('tag-container');
  const selectedTagsContainer = document.getElementById('selected-tags');
  const seminarList = document.getElementById('seminar-list');
  const resultCount = document.getElementById('result-count');

  // 文字列の正規化関数（全角半角の統一、スペース・カンマ・ピリオド・中黒の除去、小文字化）
  function normalizeText(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/[\s　・,，\.。、]/g, '') // 空白や記号を無視して突合
      .normalize('NFKC');
  }

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

  // 演習のフィルタリング（柔軟なタグマッチング ＋ 正規化フリーワード検索）
  function getFilteredSeminars() {
    const normQuery = normalizeText(searchQuery);

    return allSeminars.filter(seminar => {
      // 1. 選択中タグによる絞り込み（包含関係・部分一致の判定）
      for (const selTag of selectedTags) {
        const normSelTag = normalizeText(selTag);
        const hasMatchedTag = seminar.tags.some(t => {
          const normT = normalizeText(t);
          return normT.includes(normSelTag) || normSelTag.includes(normT);
        });

        if (!hasMatchedTag) {
          return false;
        }
      }

      // 2. フリーワード部分一致検索（教員名・研究テーマ・コード・タイプ・タグ・研究内容本文）
      if (normQuery) {
        const normName = normalizeText(seminar.name);
        const normTitle = normalizeText(seminar.title);
        const normCode = normalizeText(seminar.code);
        const normType = normalizeText(seminar.type);
        const normContent = normalizeText(seminar.content || '');
        const normTagMatch = seminar.tags.some(t => normalizeText(t).includes(normQuery));

        const isMatch = normName.includes(normQuery) ||
                        normTitle.includes(normQuery) ||
                        normCode.includes(normQuery) ||
                        normType.includes(normQuery) ||
                        normContent.includes(normQuery) ||
                        normTagMatch;

        if (!isMatch) {
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

    const normQuery = normalizeText(searchQuery);

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
          <button class="detail-toggle-btn">研究内容を見る ▼</button>
        </div>
        <div class="seminar-detail-box" style="display: none;">
          <div class="detail-title">【研究内容】</div>
          <div class="detail-content">${escapeHTML(seminar.content || '（研究内容の記載なし）')}</div>
        </div>
      `;

      // カード内タグの描画とクリックイベント
      const cardTagsContainer = card.querySelector('.card-tags');
      seminar.tags.forEach(tag => {
        const normT = normalizeText(tag);
        const isSelected = Array.from(selectedTags).some(sel => {
          const normSel = normalizeText(sel);
          return normT.includes(normSel) || normSel.includes(normT);
        });
        const isSearchMatched = normQuery && normT.includes(normQuery);

        const tagPill = document.createElement('span');
        tagPill.className = `tag-pill ${(isSelected || isSearchMatched) ? 'matched' : ''}`;
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

      // 詳細トグルボタン処理
      const detailBtn = card.querySelector('.detail-toggle-btn');
      const detailBox = card.querySelector('.seminar-detail-box');

      detailBtn.addEventListener('click', () => {
        const isOpen = detailBox.style.display !== 'none';
        if (isOpen) {
          detailBox.style.display = 'none';
          detailBtn.textContent = '研究内容を見る ▼';
        } else {
          detailBox.style.display = 'block';
          detailBtn.textContent = '研究内容を閉じる ▲';
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
