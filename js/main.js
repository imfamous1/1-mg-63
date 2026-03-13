(function () {
  'use strict';

  var data = null;
  var currentCategoryId = null;
  var currentPartId = null;

  var screenCategories = document.getElementById('screen-categories');
  var screenItems = document.getElementById('screen-items');
  var screenDetail = document.getElementById('screen-detail');
  var categoryList = document.getElementById('category-list');
  var itemList = document.getElementById('item-list');
  var itemsHeading = document.getElementById('items-heading');
  var detailHeading = document.getElementById('detail-heading');
  var detailContent = document.getElementById('detail-content');
  var backToCategories = document.getElementById('back-to-categories');
  var backToItems = document.getElementById('back-to-items');

  function showScreen(screen) {
    screenCategories.classList.remove('is-active');
    screenCategories.hidden = true;
    screenItems.classList.remove('is-active');
    screenItems.hidden = true;
    screenDetail.classList.remove('is-active');
    screenDetail.hidden = true;
    screen.classList.add('is-active');
    screen.hidden = false;
  }

  function getCategoryById(id) {
    return data.categories.find(function (c) { return c.id === id; });
  }

  function getItemsForCategory(id) {
    if (id === 'lectures' && data.lectures) {
      if (data.lectures.parts && currentPartId === null) {
        return data.lectures.parts;
      }
      if (currentPartId && data.lectures[currentPartId]) {
        return data.lectures[currentPartId];
      }
      return data.lectures.parts || [];
    }
    return Array.isArray(data[id]) ? data[id] : [];
  }

  function openLecturePart(partId) {
    currentPartId = partId;
    var part = data.lectures.parts.find(function (p) { return p.id === partId; });
    var items = data.lectures[partId] || [];
    itemsHeading.textContent = part ? part.name : '';
    itemList.innerHTML = '';
    items.forEach(function (item, index) {
      var li = document.createElement('li');
      li.className = 'item-list__item';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'item-list__btn';
      btn.textContent = item.name;
      if (item.description) {
        var descSpan = document.createElement('span');
        descSpan.className = 'item-list__desc';
        descSpan.textContent = item.description;
        btn.appendChild(descSpan);
      }
      btn.addEventListener('click', function () {
        openDetail('lectures', index);
      });
      li.appendChild(btn);
      itemList.appendChild(li);
    });
    showScreen(screenItems);
  }

  function renderCategories() {
    categoryList.innerHTML = '';
    data.categories.forEach(function (cat) {
      var li = document.createElement('li');
      li.className = 'category-list__item';
      var a = document.createElement('a');
      a.href = '#';
      a.className = 'category-list__link';
      a.textContent = cat.name;
      if (cat.description) {
        var desc = document.createElement('span');
        desc.className = 'category-list__desc';
        desc.textContent = cat.description;
        a.appendChild(desc);
      }
      a.addEventListener('click', function (e) {
        e.preventDefault();
        openCategory(cat.id);
      });
      li.appendChild(a);
      categoryList.appendChild(li);
    });
  }

  function openCategory(categoryId) {
    currentCategoryId = categoryId;
    if (categoryId === 'lectures' && data.lectures && data.lectures.parts) {
      currentPartId = null;
      itemsHeading.textContent = getCategoryById('lectures').name;
      itemList.innerHTML = '';
      data.lectures.parts.forEach(function (part) {
        var li = document.createElement('li');
        li.className = 'item-list__item';
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'item-list__btn';
        btn.textContent = part.name;
        if (part.description) {
          var descSpan = document.createElement('span');
          descSpan.className = 'item-list__desc';
          descSpan.textContent = part.description;
          btn.appendChild(descSpan);
        }
        btn.addEventListener('click', function () {
          openLecturePart(part.id);
        });
        li.appendChild(btn);
        itemList.appendChild(li);
      });
      showScreen(screenItems);
      return;
    }
    currentPartId = null;
    var cat = getCategoryById(categoryId);
    var items = getItemsForCategory(categoryId);
    itemsHeading.textContent = cat ? cat.name : '';
    itemList.innerHTML = '';
    items.forEach(function (item, index) {
      var li = document.createElement('li');
      li.className = 'item-list__item';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'item-list__btn';
      btn.textContent = item.name;
      if (item.description) {
        var descSpan = document.createElement('span');
        descSpan.className = 'item-list__desc';
        descSpan.textContent = item.description;
        btn.appendChild(descSpan);
      }
      btn.addEventListener('click', function () {
        openDetail(categoryId, index);
      });
      li.appendChild(btn);
      itemList.appendChild(li);
    });
    showScreen(screenItems);
  }

  function openDetail(categoryId, itemIndex) {
    var items = (categoryId === 'lectures' && currentPartId)
      ? (data.lectures[currentPartId] || [])
      : getItemsForCategory(categoryId);
    var item = items[itemIndex];
    if (!item) return;
    detailHeading.textContent = item.name;
    if (item.content) {
      var bodyHtml = item.content.indexOf('#') === 0 || item.content.indexOf('\n#') !== -1
        ? '<div class="detail-content__body markdown">' + markdownToHtml(item.content) + '</div>'
        : '<div class="detail-content__body"><p>' + escapeHtml(item.content).replace(/\n/g, '<br>') + '</p></div>';
      detailContent.innerHTML = bodyHtml;
      showScreen(screenDetail);
      return;
    }
    if (item.url && item.url.indexOf('.md') !== -1) {
      detailContent.innerHTML = '<p class="detail-content__loading">Загрузка материала…</p>';
      showScreen(screenDetail);
      fetch(item.url)
        .then(function (r) { return r.text(); })
        .then(function (md) {
          detailContent.innerHTML = '<div class="detail-content__body markdown">' + markdownToHtml(md) + '</div>';
        })
        .catch(function () {
          detailContent.innerHTML = (item.description ? '<p>' + escapeHtml(item.description) + '</p>' : '') +
            '<p><a href="' + escapeAttr(item.url) + '" target="_blank" rel="noopener noreferrer">Открыть материал →</a></p>';
        });
      return;
    }
    var html = '';
    if (item.description) {
      html += '<p>' + escapeHtml(item.description) + '</p>';
    }
    if (item.url) {
      html += '<p><a href="' + escapeAttr(item.url) + '" target="_blank" rel="noopener noreferrer">Открыть материал →</a></p>';
    }
    detailContent.innerHTML = html ? '<div class="detail-content__body">' + html + '</div>' : '<p>Нет содержимого.</p>';
    showScreen(screenDetail);
  }

  function markdownToHtml(md) {
    var html = '';
    var lines = md.split('\n');
    var i = 0;
    var inCode = false;
    var codeLang = '';
    var codeBuf = [];

    function flushCode() {
      if (codeBuf.length) {
        html += '<pre><code>' + escapeHtml(codeBuf.join('\n')) + '</code></pre>';
        codeBuf = [];
      }
      inCode = false;
    }

    while (i < lines.length) {
      var line = lines[i];
      if (line.indexOf('```') === 0) {
        if (inCode) {
          flushCode();
        } else {
          inCode = true;
          codeLang = line.slice(3).trim();
          codeBuf = [];
        }
        i++;
        continue;
      }
      if (inCode) {
        codeBuf.push(line);
        i++;
        continue;
      }
      if (/^###\s/.test(line)) {
        html += '<h4>' + inlineMd(line.replace(/^###\s*/, '')) + '</h4>';
        i++;
        continue;
      }
      if (/^##\s/.test(line)) {
        html += '<h3>' + inlineMd(line.replace(/^##\s*/, '')) + '</h3>';
        i++;
        continue;
      }
      if (/^#\s/.test(line)) {
        html += '<h2>' + inlineMd(line.replace(/^#\s*/, '')) + '</h2>';
        i++;
        continue;
      }
      if (/^-\s/.test(line) || /^\d+\.\s/.test(line)) {
        html += '<ul>';
        while (i < lines.length && (/^-\s/.test(lines[i]) || /^\d+\.\s/.test(lines[i]))) {
          html += '<li>' + inlineMd(lines[i].replace(/^-\s*/, '').replace(/^\d+\.\s*/, '')) + '</li>';
          i++;
        }
        html += '</ul>';
        continue;
      }
      if (line.trim() === '') {
        html += '<p></p>';
        i++;
        continue;
      }
      html += '<p>' + inlineMd(line) + '</p>';
      i++;
    }
    flushCode();
    return html;
  }

  function inlineMd(text) {
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeAttr(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  backToCategories.addEventListener('click', function () {
    if (currentCategoryId === 'lectures' && currentPartId) {
      currentPartId = null;
      openCategory('lectures');
      return;
    }
    showScreen(screenCategories);
    currentCategoryId = null;
    currentPartId = null;
  });

  backToItems.addEventListener('click', function () {
    showScreen(screenItems);
  });

  fetch('index.json')
    .then(function (r) { return r.json(); })
    .then(function (json) {
      data = json;
      renderCategories();
    })
    .catch(function () {
      categoryList.innerHTML = '<li><p>Не удалось загрузить данные. Проверьте наличие index.json.</p></li>';
    });
})();
