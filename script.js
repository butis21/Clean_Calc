// script.js — логика приложения
(function(){
  const $ = id => document.getElementById(id);
  const itemType = $('itemType');
  const width = $('width');
  const height = $('height');
  const quantity = $('quantity');
  const priceMode = $('priceMode');
  const price = $('price');
  const addBtn = $('addBtn');
  const clearForm = $('clearForm');
  const itemsTableBody = document.querySelector('#itemsTable tbody');
  const totalAmount = $('totalAmount');
  const exportCsv = $('exportCsv');
  const printBtn = $('printBtn');
  const resetAll = $('resetAll');

  let items = [];

  function cmToMeters(v){
    return Number(v) / 100;
  }

  function areaMeters(wCm, hCm){
    const w = cmToMeters(wCm || 0);
    const h = cmToMeters(hCm || 0);
    const a = w * h;
    return Math.round(a * 100000) / 100000; // keep precision
  }

  function render(){
    itemsTableBody.innerHTML = '';
    let total = 0;
    items.forEach((it, idx) => {
      const tr = document.createElement('tr');

      const area = areaMeters(it.width, it.height);
      let cost = 0;
      if(it.mode === 'sqm'){
        cost = area * it.price * it.qty;
      } else {
        cost = it.price * it.qty;
      }
      cost = Math.round(cost * 100) / 100;
      total += cost;

      tr.innerHTML = `
        <td>${idx+1}</td>
        <td>${escapeHtml(it.type)}</td>
        <td>${it.width ?? ''}</td>
        <td>${it.height ?? ''}</td>
        <td>${area.toFixed(3)}</td>
        <td>${it.qty}</td>
        <td>${it.mode === 'sqm' ? 'за м²' : 'фикс'}</td>
        <td>${Number(it.price).toFixed(2)}</td>
        <td>${cost.toFixed(2)}</td>
        <td><button data-idx="${idx}" class="deleteBtn">Удалить</button></td>
      `;
      itemsTableBody.appendChild(tr);
    });

    totalAmount.textContent = total.toFixed(2);
    // attach delete handlers
    Array.from(document.querySelectorAll('.deleteBtn')).forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        const i = Number(e.target.dataset.idx);
        items.splice(i,1);
        render();
      });
    });
  }

  function escapeHtml(s){
    if(!s) return '';
    return String(s)
      .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  }

  addBtn.addEventListener('click', ()=>{
    const w = parseFloat(width.value || 0);
    const h = parseFloat(height.value || 0);
    const qty = parseInt(quantity.value || 1);
    const priceVal = parseFloat(price.value || 0);
    const mode = priceMode.value;

    if(isNaN(qty) || qty < 1){
      alert('Введите корректное количество (>=1)');
      return;
    }
    if(mode === 'sqm' && (isNaN(w) || isNaN(h) || w <= 0 || h <= 0)){
      alert('Введите корректные размеры (ширина и высота в см) для расчёта площади.');
      return;
    }
    if(isNaN(priceVal) || priceVal < 0){
      alert('Введите корректную цену (>=0).');
      return;
    }

    const it = {
      type: itemType.value,
      width: mode === 'sqm' ? w : (w || 0),
      height: mode === 'sqm' ? h : (h || 0),
      qty: qty,
      price: priceVal,
      mode: mode
    };
    items.push(it);
    render();
    // clear width/height only if you want
    // width.value = ''; height.value = '';
  });

  clearForm.addEventListener('click', ()=>{
    width.value = '';
    height.value = '';
    quantity.value = '1';
    price.value = '';
  });

  priceMode.addEventListener('change', ()=>{
    const mode = priceMode.value;
    const lbl = document.getElementById('priceLabel');
    if(mode === 'sqm'){
      lbl.querySelector('input').placeholder = 'Цена за м², например 300';
    } else {
      lbl.querySelector('input').placeholder = 'Цена за объект, например 600';
    }
  });

  exportCsv.addEventListener('click', () => {
    if (items.length === 0) {
        alert('Нет позиций для экспорта');
        return;
    }

    const rows = [['№', 'Тип', 'Ширина (см)', 'Высота (см)', 'Площадь (м²)', 'Кол-во', 'Режим', 'Цена (руб)', 'Стоимость (руб)']];
    let idx = 1;
    items.forEach(it => {
        const area = areaMeters(it.width, it.height);
        const cost = it.mode === 'sqm' ? area * it.price * it.qty : it.price * it.qty;
        rows.push([
            idx,
            it.type,
            it.width,
            it.height,
            area.toFixed(3),
            it.qty,
            it.mode === 'sqm' ? 'за м²' : 'фикс',
            Number(it.price).toFixed(2),
            Number(cost).toFixed(2)
        ]);
        idx++;
    });
    rows.push([]);
    rows.push(['Итого', '', '', '', '', '', '', '', totalAmount.textContent]);

    // Создаем строку CSV
    const csv = rows.map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    // Используем специальный Unicode-знак (UTF-8 BOM) для явного указания кодировки
    const utf8bom = '\ufeff'; // маркер UTF-8 BOM
    const finalCSV = utf8bom + csv;

    // Создание объекта Blob с правильной кодировкой
    const blob = new Blob([finalCSV], { type: 'text/csv;charset=utf-8;' });

    // Формирование ссылки для скачивания
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'estimate.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  printBtn.addEventListener('click', ()=>{
    window.print();
  });

  resetAll.addEventListener('click', ()=>{
    if(confirm('Очистить все позиции?')){ items = []; render(); }
  });

  // initialize sample data to demonstrate (can be removed)
  items.push({type:'Дверь', width:90, height:200, qty:4, price:600, mode:'fixed'});
  items.push({type:'Окно', width:120, height:150, qty:6, price:300, mode:'sqm'});
  render();

})();