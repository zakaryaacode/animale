
function customAlert(msg) {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-alert-modal');
        const title = document.getElementById('ca-title');
        const btnConfirm = document.getElementById('ca-btn-confirm');
        title.innerText = msg;
        modal.classList.add('open');
        modal.style.display = 'flex';
        setTimeout(() => btnConfirm.focus(), 50);

        const cleanup = () => {
            modal.style.display = 'none';
            modal.classList.remove('open');
            btnConfirm.onclick = null;
        };

        btnConfirm.onclick = () => { resolve(); cleanup(); };
    });
}

function customConfirm(msg) {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-confirm-modal');
        const title = document.getElementById('cc-title');
        const btnConfirm = document.getElementById('cc-btn-confirm');
        const btnCancel = document.getElementById('cc-btn-cancel');
        title.innerText = msg;
        modal.classList.add('open');
        modal.style.display = 'flex';

        const cleanup = () => {
            modal.style.display = 'none';
            modal.classList.remove('open');
            btnConfirm.onclick = null;
            btnCancel.onclick = null;
        };

        btnConfirm.onclick = () => { resolve(true); cleanup(); };
        btnCancel.onclick = () => { resolve(false); cleanup(); };
    });
}

async function customPrompt(msg, pricePerGram = 0) {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-prompt-modal');
        const title = document.getElementById('cp-title');
        const inputQty = document.getElementById('cp-input-grams');
        const inputAmount = document.getElementById('cp-input-amount');
        const btnConfirm = document.getElementById('cp-btn-confirm');
        const btnCancel = document.getElementById('cp-btn-cancel');
        const btnG = document.getElementById('btn-unit-g');
        const btnKG = document.getElementById('btn-unit-kg');
        const qtyLabel = document.getElementById('qty-label-modal');

        let currentUnit = 'g';
        title.innerText = msg;
        inputQty.value = '';
        inputAmount.value = '';

        const setUnit = (unit) => {
            currentUnit = unit;
            if (unit === 'g') {
                btnG.classList.add('active'); btnKG.classList.remove('active');
                qtyLabel.innerText = "Quantity (Grams / غ)";
            } else {
                btnKG.classList.add('active'); btnG.classList.remove('active');
                qtyLabel.innerText = "Quantity (Kilos / كغ)";
            }
            syncInputs('amount'); // Refresh qty display based on current amount
        };

        btnG.onclick = () => setUnit('g');
        btnKG.onclick = () => setUnit('kg');

        modal.classList.add('open');
        modal.style.display = 'flex';
        setTimeout(() => inputQty.focus(), 50);

        const syncInputs = (source) => {
            if (!pricePerGram || pricePerGram <= 0) return;
            if (source === 'qty') {
                const val = parseFloat(inputQty.value) || 0;
                const grams = currentUnit === 'g' ? val : val * 1000;
                const amt = grams * pricePerGram;
                inputAmount.value = AppFinance.round(amt).toFixed(2);
            } else {
                const val = parseFloat(inputAmount.value) || 0;
                // Use higher precision for intermediate grams calculation
                const grams = val / pricePerGram;
                if (currentUnit === 'g') {
                    inputQty.value = Math.round(grams).toString();
                } else {
                    // Round to nearest mg then convert to kg
                    const kg = Math.round(grams) / 1000;
                    inputQty.value = kg.toString();
                }
            }
        };

        inputQty.oninput = () => syncInputs('qty');
        inputAmount.oninput = () => syncInputs('amount');

        const cleanup = () => {
            modal.style.display = 'none';
            modal.classList.remove('open');
            btnConfirm.onclick = null; btnCancel.onclick = null;
            btnG.onclick = null; btnKG.onclick = null;
            inputQty.oninput = null; inputAmount.oninput = null;
            inputQty.onkeydown = null; inputAmount.onkeydown = null;
        };

        btnConfirm.onclick = () => {
            const val = parseFloat(inputQty.value) || 0;
            const grams = currentUnit === 'g' ? val : val * 1000;
            resolve(grams);
            cleanup();
        };
        btnCancel.onclick = () => { resolve(null); cleanup(); };

        const handleEnter = (e) => { if (e.key === 'Enter') btnConfirm.click(); };
        inputQty.onkeydown = handleEnter;
        inputAmount.onkeydown = handleEnter;
        setUnit('g'); // Default
    });
}

async function customReturn(sale) {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-return-modal');
        const inputQty = document.getElementById('ret-input-qty');
        const refundEl = document.getElementById('ret-refund-amount');
        const btnConfirm = document.getElementById('ret-btn-confirm');
        const btnCancel = document.getElementById('ret-btn-cancel');
        const errorEl = document.getElementById('ret-qty-error');
        const prodNameEl = document.getElementById('ret-product-name');
        const maxQtyEl = document.getElementById('ret-max-qty');

        const lang = localStorage.getItem('lang') || 'ar';
        const avgPrice = sale.total / sale.qty;

        prodNameEl.innerText = sale.productName;
        maxQtyEl.innerText = (lang === 'ar' ? 'الكمية الأصلية: ' : 'Original Qty: ') + formatQty(sale.qty, sale.unit) + ' ' + sale.unit;

        // Set input constraints based on unit
        if (sale.unit === 'pcs') {
            inputQty.step = "1";
            inputQty.value = Math.round(sale.qty);
        } else {
            inputQty.step = "any";
            inputQty.value = formatQty(sale.qty, sale.unit);
        }

        refundEl.innerText = sale.total.toFixed(2) + ' DA';
        errorEl.style.display = 'none';

        modal.classList.add('open');
        modal.style.display = 'flex';
        setTimeout(() => inputQty.focus(), 50);

        const updateRefund = () => {
            let q = parseFloat(inputQty.value) || 0;
            if (sale.unit === 'pcs') q = Math.round(q);

            if (q > sale.qty) {
                errorEl.style.display = 'block';
                btnConfirm.disabled = true;
                btnConfirm.style.opacity = 0.5;
            } else {
                errorEl.style.display = 'none';
                btnConfirm.disabled = false;
                btnConfirm.style.opacity = 1;
                const refund = q * avgPrice;
                refundEl.innerText = AppFinance.round(refund).toFixed(2) + ' DA';
            }
        };

        inputQty.oninput = updateRefund;

        const cleanup = () => {
            modal.style.display = 'none';
            modal.classList.remove('open');
            btnConfirm.onclick = null;
            btnCancel.onclick = null;
            inputQty.oninput = null;
        };

        btnConfirm.onclick = () => {
            let q = parseFloat(inputQty.value) || 0;
            if (sale.unit === 'pcs') q = Math.round(q);
            if (q <= 0 || q > sale.qty) return;
            resolve(q);
            cleanup();
        };
        btnCancel.onclick = () => { resolve(null); cleanup(); };

        inputQty.onkeydown = (e) => { if (e.key === 'Enter') btnConfirm.click(); };
    });
}

function formatQty(q, unit) {
    const n = AppFinance.safeNum(q);
    // For 'pcs', strictly return integers to avoid "1.998" display
    if (unit === 'pcs') return Math.round(n).toString();
    // If very close to an integer (e.g. 1.99999 or 2.00001), snap to it
    if (Math.abs(n - Math.round(n)) < 0.00001) return Math.round(n).toString();
    // For weights, show up to 3 decimals, but strip trailing zeros
    return parseFloat(n.toFixed(3)).toString();
}



// --- Translation & Localization ---
const translations = {
    fr: {
        // Nav
        nav_dashboard: "Tableau de bord",
        nav_inventory: "Inventaire",
        nav_sales: "Ventes",
        nav_expenses: "Dépenses",
        nav_analytics: "Analyse des produits",
        nav_reports: "Rapports financiers",
        nav_trash: "Corbeille",

        // Dashboard Titles
        title_dashboard: "Aperçu du tableau de bord",
        title_inventory: "Gestion de l'inventaire",
        title_sales: "Ventes et revenus",
        title_expenses: "Dépenses professionnelles",
        title_analytics: "Synthèse de performance",
        title_reports: "Rapports financiers & Historique",
        title_trash: "Corbeille",

        // Stats
        stat_stock: "Articles en stock",
        stat_profit_today: "Bénéfice d'aujourd'hui",
        stat_profit_month: "Bénéfice 30 jours",
        btn_install: "Installer l'application",

        // Headings
        hd_low_stock: "Alertes de stock faible",
        hd_product_list: "Liste des produits",
        hd_add_product: "Ajouter un produit",
        hd_recent_sales: "Ventes récentes",
        hd_new_sale: "Nouvelle vente",
        hd_expenses_log: "Registre des dépenses",
        hd_add_expense: "Ajouter une dépense",
        hd_deleted_products: "Produits supprimés",
        hd_deleted_others: "Ventes et dépenses supprimées",
        hd_synthesis: "Synthèse et analyse des bénéfices",
        hd_daily: "Rapport quotidien",
        hd_monthly: "Rapport mensuel",
        hd_yearly: "Rapport annuel",

        // Table Headers
        th_product: "Produit",
        th_qty: "Quantité",
        th_action: "Action",
        th_date: "Date",
        th_total: "Total",
        th_desc: "Description",
        th_amount: "Montant",
        th_type: "Type",
        th_current_stock: "Stock actuel",
        th_total_sold: "Total vendu",
        th_total_invest: "Investissement total",
        th_sell_price: "Prix de vente",
        th_total_rev: "Revenu total",
        th_net_profit: "Bénéfice net",

        // Forms & Labels
        lbl_product_name: "Nom du produit",
        lbl_num_bags: "Nombre de sacs/articles",
        lbl_size_bag: "Taille par sac/article",
        lbl_unit_size: "Unité de taille",
        lbl_total_cost: "Coût total du lot (DA)",
        lbl_sell_price_bag: "Prix de vente unitaire (DA)",
        lbl_sale_mode: "Mode de vente",
        lbl_by_qty: "Par quantité",
        lbl_by_amt: "Par montant (DA)",
        lbl_by_gram: "Par grammes (g)",
        lbl_qty: "Quantité",
        lbl_qty_g: "Quantité (g)",
        lbl_amount: "Montant (DA)",
        lbl_price_per_kg: "Prix par 1kg (DA)",

        // Buttons & Options
        btn_add_stock: "Ajouter au stock",
        btn_record_sale: "Enregistrer la vente",
        btn_save_expense: "Enregistrer la dépense",
        btn_clear: "Effacer",
        btn_clear_all: "Tout effacer",
        opt_pcs: "Pièce (Pcs)",
        opt_kg: "Kilo (Kg)",
        opt_g: "Gramme (g)",
        placeholder_elec: "ex: facture d'électricité",
        sel_product: "Sélectionner un produit...",

        // New Additions
        lbl_record_past: "Enregistrer comme vente passée",
        lbl_past_date: "Sélectionner date passée",
        lbl_custom_details: "Détails du produit (Perso)",
        ph_custom_name: "Nom de l'article...",
        opt_pcs_short: "pcs",
        opt_custom_item: "Article personnalisé / Hors stock",
        hd_backup: "Sauvegarde & Restauration",
        txt_backup_warn: "Protégez vos données !",
        txt_backup_desc: "Téléchargez régulièrement un fichier de sauvegarde pour éviter toute perte de données.",
        btn_dl_backup: "Télécharger sauvegarde",
        btn_restore_db: "Restaurer DB",

        // POS Additions Phase 1
        nav_pos: "Scanner POS",
        title_pos: "Point de vente (Scanner)",
        lbl_barcode: "Code-barres",
        ph_barcode: "Scanner ou taper...",

        // Credits System
        nav_credits: "Crédits (Dettes)",
        title_credits: "Gestion des crédits & dettes",
        hd_unpaid_credits: "Crédits impayés",
        hd_new_credit: "Enregistrer crédit",
        lbl_customer_name: "Nom du client",
        ph_customer_name: "ex: Ahmed...",
        ph_search_customer: "Rechercher client...",
        ph_search_product: "Chercher produit ou code-barres...",
        th_customer: "Client",
        btn_paid: "Payé",
        stat_total_credit: "Total crédit impayé",
        stat_credit_profit: "Bénéfice net prévu",
        txt_no_credits: "Génial ! Aucun crédit impayé.",
        btn_return_sale: "Retourner l'article",
        confirm_return: "Voulez-vous retourner cet article au stock ?",
        lbl_barcode_lookup: "Recherche par Code-Barres",
        lbl_return_qty: "Quantité à retourner",
        lbl_refund_amount: "Montant à rembourser",
        err_return_qty: "La quantité dépasse la vente originale !"
    },
    en: {
        // Nav
        nav_dashboard: "Dashboard",
        nav_inventory: "Inventory",
        nav_sales: "Sales",
        nav_expenses: "Expenses",
        nav_analytics: "Product Analytics",
        nav_reports: "Financial Reports",
        nav_trash: "Recycle Bin",

        // Dashboard Titles
        title_dashboard: "Dashboard Overview",
        title_inventory: "Inventory Management",
        title_sales: "Sales & Revenue",
        title_expenses: "Business Expenses",
        title_analytics: "Product Performance Analysis",
        title_reports: "Financial Reports & Log",
        title_trash: "Recycle Bin",

        // Stats
        stat_revenue: "Total Revenue",
        stat_profit: "Net Profit",
        stat_expenses: "Total Expenses",
        stat_stock: "Items in Stock",
        stat_profit_today: "Today's Profit",
        stat_profit_month: "30 Days Profit",
        btn_install: "Install App",

        // Headings
        hd_low_stock: "Low Stock Alerts",
        hd_product_list: "Product List",
        hd_add_product: "Add Product",
        hd_recent_sales: "Recent Sales",
        hd_new_sale: "New Sale",
        hd_expenses_log: "Expenses Log",
        hd_add_expense: "Add Expense",
        hd_deleted_products: "Deleted Products",
        hd_deleted_others: "Deleted Sales & Expenses",
        hd_synthesis: "Product Sales & Profit Synthesis",
        hd_daily: "Daily Report",
        hd_monthly: "Monthly Report",
        hd_yearly: "Yearly Report",

        // Table Headers
        th_product: "Product",
        th_qty: "Quantity",
        th_action: "Action",
        th_date: "Date",
        th_total: "Total",
        th_desc: "Description",
        th_amount: "Amount",
        th_type: "Type",
        th_current_stock: "Current Stock",
        th_total_sold: "Total Sold",
        th_total_invest: "Total Investment",
        th_sell_price: "Sell Price",
        th_total_rev: "Total Revenue",
        th_net_profit: "Net Profit",

        // Forms & Labels
        lbl_product_name: "Product Name",
        lbl_num_bags: "Number of Bags / Goods",
        lbl_size_bag: "Size per Bag/Unit",
        lbl_unit_size: "Unit Size",
        lbl_total_cost: "Total Cost (DA)",
        lbl_sell_price_bag: "Unit Sell Price (DA)",
        lbl_sale_mode: "Sale Mode",
        lbl_by_qty: "By Quantity",
        lbl_by_amt: "By Amount (DA)",
        lbl_by_gram: "By Grams (g)",
        lbl_qty: "Quantity",
        lbl_qty_g: "Quantity in Grams (g)",
        lbl_amount: "Amount (DA)",
        lbl_price_per_kg: "Price per 1kg (DA)",

        // Buttons & Options
        btn_add_stock: "Add to Stock",
        btn_record_sale: "Record Sale",
        btn_save_expense: "Save Expense",
        btn_clear: "Clear",
        btn_clear_all: "Clear All",
        opt_pcs: "Piece (Pcs)",
        opt_kg: "Kilo (Kg)",
        opt_g: "Gram (g)",
        placeholder_elec: "e.g. Electricity Bill",
        sel_product: "Select Product...",

        // New Additions
        lbl_record_past: "Record as Past Sale",
        lbl_past_date: "Select Past Date",
        lbl_custom_details: "Product Details (Custom)",
        ph_custom_name: "Product Name...",
        opt_pcs_short: "pcs",
        opt_custom_item: "Custom Item / Out of Stock",
        hd_backup: "Database Backup",
        txt_backup_warn: "Protect your data!",
        txt_backup_desc: "Download a backup file regularly. You can use it to restore all your sales and inventory in case of phone loss or data wipe.",
        btn_dl_backup: "Download Backup",
        btn_restore_db: "Restore Database",

        // POS Additions Phase 1
        nav_pos: "POS Scanner",
        title_pos: "Point of Sale & Scanner",
        lbl_barcode: "Barcode",
        ph_barcode: "Scan or Type...",

        // Credits System
        nav_credits: "Credits (Dettes)",
        title_credits: "Credits & Debts Management",
        hd_unpaid_credits: "Unpaid Credits List",
        hd_new_credit: "Record New Credit",
        lbl_customer_name: "Customer Name",
        ph_customer_name: "e.g. Ahmed...",
        ph_search_customer: "Search by name...",
        ph_search_product: "Search for product by name or barcode...",
        th_customer: "Customer",
        btn_paid: "Paid",
        stat_total_credit: "Total Unpaid Credit",
        stat_credit_profit: "Expected Net Profit",
        txt_no_credits: "Great! No unpaid credits.",
        btn_return_sale: "Return to Stock",
        confirm_return: "Do you want to return this item to stock?",
        lbl_barcode_lookup: "Barcode Lookup",
        lbl_return_qty: "Quantity to return",
        lbl_refund_amount: "Amount to refund",
        err_return_qty: "Quantity exceeds original sale!"
    },
    ar: {
        // Nav
        nav_dashboard: "لوحة التحكم",
        nav_inventory: "المخزن",
        nav_sales: "المبيعات",
        nav_expenses: "المصاريف",
        nav_analytics: "تحليل المنتجات",
        nav_reports: "التقارير المالية",
        nav_trash: "سلة المهملات",

        // Dashboard Titles
        title_dashboard: "نظرة عامة على لوحة التحكم",
        title_inventory: "إدارة المخزن",
        title_sales: "المبيعات والإيرادات",
        title_expenses: "مصاريف العمل",
        title_analytics: "تحليل أداء المنتجات",
        title_reports: "التقارير المالية والسجل",
        title_trash: "سلة المهملات",

        // Stats
        stat_revenue: "إجمالي الإيرادات",
        stat_profit: "الربح الصافي",
        stat_expenses: "إجمالي المصاريف",
        stat_stock: "السلع في المخزن",
        stat_profit_today: "أرباح اليوم",
        stat_profit_month: "أرباح 30 يوم",
        btn_install: "تثبيت التطبيق",

        // Headings
        hd_low_stock: "تنبيهات نقص المخزون",
        hd_product_list: "قائمة المنتجات",
        hd_add_product: "إضافة سلعة",
        hd_recent_sales: "المبيعات الأخيرة",
        hd_new_sale: "عملية بيع جديدة",
        hd_expenses_log: "سجل المصاريف",
        hd_add_expense: "إضافة مصروف",
        hd_deleted_products: "المنتجات المحذوفة",
        hd_deleted_others: "المبيعات والمصاريف المحذوفة",
        hd_synthesis: "تحليل مبيعات وأرباح السلع",
        hd_daily: "التقرير اليومي",
        hd_monthly: "التقرير الشهري",
        hd_yearly: "التقرير السنوي",

        // Table Headers
        th_product: "المنتج",
        th_qty: "الكمية",
        th_action: "الإجراء",
        th_date: "التاريخ",
        th_total: "الإجمالي",
        th_desc: "الوصف",
        th_amount: "المبلغ",
        th_type: "النوع",
        th_current_stock: "المخزون الحالي",
        th_total_sold: "المجموع المباع",
        th_total_invest: "إجمالي الاستثمار",
        th_sell_price: "سعر البيع",
        th_total_rev: "إجمالي الإيرادات",
        th_net_profit: "الربح الصافي",

        // Forms & Labels
        lbl_product_name: "اسم المنتج",
        lbl_num_bags: "عدد الأكياس / البضاعة",
        lbl_size_bag: "حجم الكيس الواحد",
        lbl_unit_size: "وحدة الحجم",
        lbl_total_cost: "إجمالي التكلفة (DA)",
        lbl_sell_price_bag: "سعر بيع الكيس/الوحدة (DA)",
        lbl_sale_mode: "طريقة البيع",
        lbl_by_qty: "بالكمية",
        lbl_by_amt: "بالمبلغ (DA)",
        lbl_by_gram: "بالغرام (g)",
        lbl_qty: "الكمية",
        lbl_qty_g: "الكمية بالغرام (g)",
        lbl_amount: "المبلغ (DA)",
        lbl_price_per_kg: "سعر 1 كيلو (DA)",

        // Buttons & Options
        btn_add_stock: "إضافة للمخزن",
        btn_record_sale: "تسجيل المبيعات",
        btn_save_expense: "حفظ المصروف",
        btn_clear: "تفريغ",
        btn_clear_all: "تفريغ الكل",
        opt_pcs: "قطعة (الحبة)",
        opt_kg: "كيلو (Kg)",
        opt_g: "غرام (g)",
        placeholder_elec: "مثال: فاتورة الكهرباء",
        sel_product: "اختر المنتج...",

        // New Additions
        lbl_record_past: "تسجيل كمبيعة قديمة",
        lbl_past_date: "اختيار تاريخ سابق",
        lbl_custom_details: "تفاصيل المنتج (مخصص)",
        ph_custom_name: "اسم المنتج المباع...",
        opt_pcs_short: "حبة",
        opt_custom_item: "منتج مخصص / خارج المخزن",
        hd_backup: "النسخ الاحتياطي لقاعدة البيانات",
        txt_backup_warn: "احمِ بياناتك!",
        txt_backup_desc: "قم بتنزيل ملف النسخ الاحتياطي بانتظام. يمكنك استخدامه لاستعادة كل مبيعاتك ومخزونك في حال ضياع الهاتف أو مسح البيانات.",
        btn_dl_backup: "تنزيل نسخة احتياطية",
        btn_restore_db: "استرجاع النسخة (Restore)",

        // POS Additions Phase 1
        nav_pos: "نقطة البيع (سكانير)",
        title_pos: "نقطة البيع والسكانير",
        lbl_barcode: "الباركود",
        ph_barcode: "قم بالمسح...",

        // Credits System
        nav_credits: "الديون (الكريدي)",
        title_credits: "إدارة الديون والكريدي",
        hd_unpaid_credits: "قائمة الديون",
        hd_new_credit: "تسجيل كريدي جديد",
        lbl_customer_name: "اسم الزبون",
        ph_customer_name: "مثال: أحمد...",
        ph_search_customer: "ابحث بالاسم...",
        ph_search_product: "بحث عن منتج بالاسم أو الباركود...",
        th_customer: "الزبون",
        btn_paid: "تم الدفع",
        stat_total_credit: "إجمالي قيمة الديون",
        stat_credit_profit: "الربح الصافي المتوقع",
        txt_no_credits: "رائع! لا يوجد ديون غير مدفوعة.",
        btn_return_sale: "إرجاع للمخزن",
        confirm_return: "هل تريد إرجاع هذه السلعة للمخزن؟",
        lbl_barcode_lookup: "بحث بالباركود",
        lbl_return_qty: "الكمية المراد إرجاعها",
        lbl_refund_amount: "المبلغ الذي سيتم استرجاعه",
        err_return_qty: "الكمية تتجاوز كمية البيع الأصلية!"
    }
};

function setLanguage(lang) {
    // Ensure lang is valid, fallback to English
    if (!translations[lang]) lang = 'en';

    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('lang', lang);

    // Update UI Button Text to show current language
    const langTextEl = document.getElementById('current-lang-text');
    if (langTextEl) langTextEl.innerText = lang.toUpperCase();

    const t = translations[lang];

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            el.innerText = t[key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) {
            el.setAttribute('placeholder', t[key]);
        }
    });

    // Re-render dynamic parts
    if (typeof renderAll === 'function') {
        try { renderAll(); } catch (e) { console.error("renderAll failed", e); }
    }

    // Update Header Title
    const activeNav = document.querySelector('.nav-item.active');
    if (activeNav && activeNav.getAttribute('onclick')) {
        const match = activeNav.getAttribute('onclick').match(/'([^']+)'/);
        const viewId = match ? match[1] : null;

        if (viewId) {
            const titles = {
                dashboard: t.title_dashboard,
                inventory: t.title_inventory,
                sales: t.title_sales,
                expenses: t.title_expenses,
                analytics: t.title_analytics,
                reports: t.title_reports,
                trash: t.title_trash,
                credits: t.title_credits || 'Credits & Debts Management',
                pos: t.title_pos
            };
            if (titles[viewId]) document.getElementById('view-title').innerText = titles[viewId];
        }
    }
}

function toggleLanguage() {
    const currentLang = localStorage.getItem('lang') || 'ar';
    let nextLang = 'en';
    if (currentLang === 'en') nextLang = 'fr';
    else if (currentLang === 'fr') nextLang = 'ar';
    else if (currentLang === 'ar') nextLang = 'en';
    setLanguage(nextLang);
}

document.getElementById('lang-toggle').addEventListener('click', toggleLanguage);

function initLang() {
    const savedLang = localStorage.getItem('lang') || 'ar';
    setLanguage(savedLang);
}

// --- Data Migration (PetShop -> Animal Land) ---
(function migrateKeys() {
    const keysToMigrate = [
        { old: 'petshop_db', new: 'animal_land_db' },
        { old: 'petshop_pos_cart', new: 'animal_land_pos_cart' },
        { old: 'petshop_privacy_pin_hash', new: 'animal_land_privacy_pin_hash' },
        { old: 'petshop_biometric_cred', new: 'animal_land_biometric_cred' },
        { old: 'petshop_recovery_hash', new: 'animal_land_recovery_hash' }
    ];
    keysToMigrate.forEach(pair => {
        if (localStorage.getItem(pair.old) && !localStorage.getItem(pair.new)) {
            localStorage.setItem(pair.new, localStorage.getItem(pair.old));
        }
    });
})();

let defaultState = {
    products: [],
    sales: [],
    expenses: [],
    credits: [],
    trash: { products: [], sales: [], expenses: [], credits: [] }
};
let state = JSON.parse(localStorage.getItem('animal_land_db')) || defaultState;

// FIFO Data Migration: Ensure all products have a batches array with sellPrice
if (state.products) {
    state.products.forEach(p => {
        if (!p.batches || p.batches.length === 0) {
            const firstPromo = (p.promoEnabled && p.promos && p.promos[0]) ? p.promos[0] : null;
            p.batches = [{
                id: Date.now() - 1000,
                qty: p.qty || 0,
                cost: p.unitCost || 0,
                sellPrice: p.sellPrice || 0,
                promoQty: firstPromo ? Math.round(firstPromo.qty) : 0,
                promoPrice: firstPromo ? Math.round(firstPromo.price) : 0,
                date: new Date(Date.now() - 86400000).toISOString()
            }];
        } else {
            // Patch existing batches missing sellPrice
            p.batches.forEach(b => {
                if (!b.sellPrice) b.sellPrice = p.sellPrice || 0;
                if (!b.promoQty) {
                    const fp = (p.promoEnabled && p.promos && p.promos[0]) ? p.promos[0] : null;
                    b.promoQty = fp ? Math.round(fp.qty) : 0;
                    b.promoPrice = fp ? Math.round(fp.price) : 0;
                }
            });
        }
    });
}
if (state.trash && state.trash.products) {
    state.trash.products.forEach(p => {
        if (!p.batches || p.batches.length === 0) {
            p.batches = [{
                id: Date.now() - 2000,
                qty: p.qty || 0,
                cost: p.unitCost || 0,
                date: new Date().toISOString()
            }];
        }
    });
}

// Ensure trash & credits exist for older versions
if (!state.trash) state.trash = defaultState.trash;
if (!state.credits) state.credits = defaultState.credits;
if (!state.trash.credits) state.trash.credits = defaultState.trash.credits;

let editingId = null; // Track product being edited
let restockingId = null; // Track product being restocked
let sellPriceManuallySet = false; // [BUG-2 FIXED] Was referenced but never declared — caused implicit global corruption

function saveState() {
    localStorage.setItem('animal_land_db', JSON.stringify(state));
    renderAll();
}

// --- UI Logic ---
function switchView(viewId, el) {
    // Definitively handle POS view state for CSS
    if (viewId === 'pos-view' || viewId === 'pos') {
        document.body.classList.add('pos-active');
    } else {
        document.body.classList.remove('pos-active');
    }

    // Handle Credits view state for CSS (hide stats)
    if (viewId === 'credits') {
        document.body.classList.add('credits-active');
    } else {
        document.body.classList.remove('credits-active');
    }

    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.querySelector(`#${viewId}-view`).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    if (el) el.classList.add('active');

    const lang = localStorage.getItem('lang') || 'en';
    const titles = {
        dashboard: translations[lang].title_dashboard,
        inventory: translations[lang].title_inventory,
        sales: translations[lang].title_sales,
        expenses: translations[lang].title_expenses,
        analytics: translations[lang].title_analytics,
        reports: translations[lang].title_reports,
        trash: translations[lang].title_trash,
        credits: translations[lang].title_credits || 'Credits & Debts Management'
    };
    document.getElementById('view-title').innerText = titles[viewId];

    // Close sidebar on mobile after selection
    // Close sidebar on mobile after selection
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('mobile-open');
    }

    // Scroll to top on view switch
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Initialize barcodes container if entering inventory
    if (viewId === 'inventory') {
        const container = document.getElementById('barcode-inputs-container');
        if (container && container.innerHTML.trim() === '') {
            addBarcodeField();
        }
    }
}

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const icon = document.getElementById('theme-icon');
    icon.setAttribute('data-lucide', savedTheme === 'dark' ? 'moon' : 'sun');
    lucide.createIcons();
}

document.getElementById('theme-toggle').addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    const icon = document.getElementById('theme-icon');
    icon.setAttribute('data-lucide', newTheme === 'dark' ? 'moon' : 'sun');
    lucide.createIcons();

    if (myChart) updateChart();
});

// Close sidebar when clicking outside (on the main content) on mobile
document.querySelector('main').addEventListener('click', () => {
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('mobile-open');
    }
});

// --- PWA Installation Logic ---
let deferredPrompt;
const installBtn = document.getElementById('pwa-install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI to notify the user they can add to home screen
    installBtn.style.display = 'flex';
});

// [BUG-1 FIXED] Removed duplicate/incomplete handleUnitChange definition.
// The correct full definition is below (~line 877) and handles both size-input-container and kg-price-container.

installBtn.addEventListener('click', () => {
    if (!deferredPrompt) {
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            alert("⚠️ ميزة التثبيت تحتاج إلى رابط HTTPS آمن لكي تعمل. \n PWA Installation requires a secure HTTPS connection.");
        } else {
            alert("التطبيق مثبت بالفعل أو أن متصفحك لا يدعم هذه الميزة حالياً. \n App already installed or browser not supported.");
        }
        return;
    }
    // Show the prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        deferredPrompt = null;
        installBtn.style.display = 'none';
    });
});

// --- Pricing Sync Engine ---
function handleUnitChange() {
    const unit = document.getElementById('p-unit').value;
    const sizeContainer = document.getElementById('size-input-container');
    const kgContainer = document.getElementById('kg-price-container');

    if (unit === 'pcs') {
        sizeContainer.style.display = 'none';
        kgContainer.style.display = 'none';
        document.getElementById('p-size').value = 1;
    } else {
        sizeContainer.style.display = 'block';
        kgContainer.style.display = 'block';
        syncPrices('bag');
    }
}

function syncPrices(source) {
    const rawSize = parseFloat(document.getElementById('p-size').value) || 1;
    const unit = document.getElementById('p-unit').value;
    if (unit === 'pcs') return;

    // Snap size to avoid float noise
    const sizeInput = AppFinance.safeNum(rawSize);
    let sizeInKg = unit === 'g' ? sizeInput / 1000 : sizeInput;
    sizeInKg = AppFinance.safeNum(sizeInKg);

    const bagInput = document.getElementById('p-sell-price');
    const kgInput = document.getElementById('p-price-kg');

    if (source === 'bag') {
        const bagPrice = AppFinance.safeNum(parseFloat(bagInput.value) || 0);
        kgInput.value = sizeInKg > 0 ? Math.round(bagPrice / sizeInKg) : 0;
    } else if (source === 'kg') {
        if (!sellPriceManuallySet) {
            const kgPrice = AppFinance.safeNum(parseFloat(kgInput.value) || 0);
            bagInput.value = Math.round(AppFinance.safeNum(kgPrice * sizeInKg));
        }
    } else if (source === 'size') {
        const bagPrice = AppFinance.safeNum(parseFloat(bagInput.value) || 0);
        if (bagPrice > 0 && sizeInKg > 0) {
            kgInput.value = Math.round(bagPrice / sizeInKg);
        }
    }
}

// Bag price: user is manually typing → set flag, only update kg
document.getElementById('p-sell-price').addEventListener('input', () => {
    sellPriceManuallySet = true;
    syncPrices('bag');
});

// Kg price: update bag price (only if not manually set)
document.getElementById('p-price-kg').addEventListener('input', () => syncPrices('kg'));

// Size change: only update kg field, never bag price
document.getElementById('p-size').addEventListener('input', () => syncPrices('size'));

// Reset flag when the form is reset (new product)
document.getElementById('product-form').addEventListener('reset', () => {
    sellPriceManuallySet = false;
});

// Init format
handleUnitChange();

// --- Helper: Financial Precision ---
const roundMoney = (v) => AppFinance.round(v);

const parseDateSafety = (dateStr) => {
    let d = new Date(dateStr);
    if (isNaN(d)) {
        const p = dateStr.split('/');
        if (p.length === 3) d = new Date(p[2], p[1] - 1, p[0]);
    }
    return d;
};

// --- Helper: Bulletproof Precision Engine ---
/**
 * AppFinance provides a robust framework for financial and inventory calculations.
 * It uses integer-based arithmetic to eliminate floating-point noise.
 */
const AppFinance = {
    PRECISION: 10000, // 4 decimal places of precision

    /**
     * Converts a float/string to a high-precision integer representation.
     * Includes a heuristic snapper to eliminate float noise before conversion.
     */
    toInternal: (v) => {
        let n = parseFloat(v) || 0;
        // Snap to nearest integer if within a very tiny epsilon (float noise recovery)
        if (Math.abs(n - Math.round(n)) < 0.000001) n = Math.round(n);
        return Math.round(n * AppFinance.PRECISION);
    },

    /**
     * Converts a high-precision integer back to a standard float.
     */
    toExternal: (v) => v / AppFinance.PRECISION,

    /**
     * Sanitizes a value by snapping it to the nearest precision point.
     * Guaranteed to eliminate noise like 1.9999999999 -> 2.0
     */
    safeNum: (v) => {
        const n = parseFloat(v);
        if (isNaN(n)) return 0;
        const internal = Math.round(n * AppFinance.PRECISION);
        return internal / AppFinance.PRECISION;
    },

    /**
     * Standardizes stock values.
     */
    stock: (v) => AppFinance.safeNum(v),

    /**
     * Rounds a value to the nearest integer (currency usually).
     */
    round: (v) => Math.round(AppFinance.safeNum(v)),

    /**
     * Calculates profit with absolute precision.
     */
    calcProfit: (rev, cost) => AppFinance.round(rev - cost),

    /**
     * Matches the best promotion for a given quantity.
     * Uses tolerance matching to handle micro-discrepancies.
     */
    getBestPromo: (product, qty) => {
        if (!product.promoEnabled || !product.promos || product.promos.length === 0) return null;
        
        const internalQty = AppFinance.toInternal(qty);
        const sorted = [...product.promos].sort((a, b) => b.qty - a.qty);
        
        for (const p of sorted) {
            const internalPromoQty = AppFinance.toInternal(p.qty);
            // Check if qty meets or is extremely close to promo qty
            if (internalQty >= internalPromoQty || Math.abs(internalQty - internalPromoQty) < 5) {
                return p;
            }
        }
        return null;
    }
};


const StorageManager = {
    getUsage: () => {
        let total = 0;
        for (let x in localStorage) {
            if (localStorage.hasOwnProperty(x)) {
                total += ((localStorage[x].length + x.length) * 2);
            }
        }
        return (total / 1024 / 1024).toFixed(2); // In MB
    },
    isHealthy: () => StorageManager.getUsage() < 4.5, // 5MB limit
    alertIfNeeded: () => {
        const usage = StorageManager.getUsage();
        if (usage > 4) {
            customAlert(`⚠️ تحذير: الذاكرة ممتلئة بنسبة ${(usage / 5 * 100).toFixed(0)}%. يرجى عمل نسخة احتياطية (Backup).`, true);
        }
    }
};

// --- Core Functions ---

// Products
document.getElementById('product-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const bags = Math.round(parseFloat(document.getElementById('p-bags').value));
    const unit = document.getElementById('p-unit').value;
    let size = parseFloat(document.getElementById('p-size').value);

    if (unit === 'pcs') size = 1;

    // Safe multiply: eliminates floating-point noise (e.g. 3×1 = 2.9999)
    const totalStock = AppFinance.stock(AppFinance.safeNum(bags * size));
    const totalCost = AppFinance.round(parseFloat(document.getElementById('p-total-cost').value));

    // Gather barcodes: Main + Modal ones
    const mainBarcode = document.getElementById('p-barcode-main').value.trim();
    const barcodes = [...currentModalBarcodes];
    if (mainBarcode && !barcodes.includes(mainBarcode)) {
        barcodes.unshift(mainBarcode);
    }

    const product = {
        id: Date.now(),
        barcodes: barcodes,
        barcode: mainBarcode || barcodes[0] || '', // Compatibility
        name: document.getElementById('p-name').value,
        unit: document.getElementById('p-unit').value,
        itemCount: bags,
        itemSize: size,
        qty: AppFinance.stock(totalStock),
        initialQty: AppFinance.stock(totalStock),
        totalCost: AppFinance.round(totalCost),
        unitCost: totalStock > 0 ? totalCost / totalStock : 0,
        batches: [{
            id: Date.now(),
            qty: AppFinance.stock(totalStock),
            cost: totalStock > 0 ? totalCost / totalStock : 0,
            sellPrice: AppFinance.round(parseFloat(document.getElementById('p-sell-price').value) || 0),
            promoQty: (document.getElementById('p-promo-toggle').checked && document.querySelector('#promo-list-container .promo-item')) ? (parseFloat(document.querySelector('#promo-list-container .promo-item .promo-qty-val')?.value) || 0) : 0,
            promoPrice: (document.getElementById('p-promo-toggle').checked && document.querySelector('#promo-list-container .promo-item')) ? (parseFloat(document.querySelector('#promo-list-container .promo-item .promo-price-val')?.value) || 0) : 0,
            date: new Date().toISOString()
        }],
        sellPrice: AppFinance.round(parseFloat(document.getElementById('p-sell-price').value) || 0),
        // New Promo Fields
        promoEnabled: document.getElementById('p-promo-toggle').checked,
        promos: Array.from(document.querySelectorAll('#promo-list-container .promo-item')).map(row => ({
            qty: parseFloat(row.querySelector('.promo-qty-val').value) || 0,
            price: parseFloat(row.querySelector('.promo-price-val').value) || 0
        })).filter(pr => pr.qty > 0)
    };
    state.products.push(product);
    e.target.reset();

    // RESET Barcode Modal State
    currentModalBarcodes = [];
    updateBarcodeBadge();

    // RESET Promo UI State
    document.getElementById('promo-list-container').innerHTML = '';
    document.getElementById('promo-manager').style.display = 'none';
    handleUnitChange();
    saveState();
});

function addPromoRow(data = { qty: '', price: '' }) {
    const container = document.getElementById('promo-list-container');
    const row = document.createElement('div');
    row.className = 'promo-item animated-fade-in';
    row.innerHTML = `
                <div>
                    <label>الكمية (Qty)</label>
                    <input type="number" class="promo-qty-val" value="${data.qty}" placeholder="10">
                </div>
                <div>
                    <label>السعر (Total Price)</label>
                    <input type="number" class="promo-price-val" value="${data.price}" step="0.01" placeholder="800">
                </div>
                <button type="button" class="delete-btn" onclick="this.parentElement.remove()" style="padding: 0.4rem; color: var(--danger);">
                    <i data-lucide="trash-2"></i>
                </button>
            `;
    container.appendChild(row);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function addPromoRowToEdit(productId, btn) {
    const container = btn 
        ? btn.closest('.promo-manager-container').querySelector('.promo-list')
        : document.getElementById(`edit-promo-list-${productId}`);
    
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'promo-item';
    row.innerHTML = `
                <div><input type="number" class="promo-qty-val" placeholder="Qty"></div>
                <div><input type="number" class="promo-price-val" step="0.01" placeholder="Price"></div>
                <button type="button" class="delete-btn" onclick="this.parentElement.remove()" style="padding:0.2rem; color:var(--danger);"><i data-lucide="x"></i></button>
            `;
    container.appendChild(row);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function deleteProduct(id) {
    const index = state.products.findIndex(p => p.id === id);
    if (index !== -1) {
        state.trash.products.push(state.products.splice(index, 1)[0]);
        saveState();
    }
}

function editProduct(id) {
    editingId = id;
    restockingId = null;
    renderAll();
}

function cancelEdit() {
    editingId = null;
    renderAll();
}

function saveProductEdit(id, btn) {
    const product = state.products.find(p => p.id === id);
    if (!product) return;

    // Context-aware selection to handle multiple rendered views (Mobile/Desktop)
    const root = btn ? btn.closest('.product-edit-root') : document.body;
    
    const newName = root.querySelector(`[id^="edit-name-${id}"]`)?.value.trim();
    const newSellPrice = parseFloat(root.querySelector(`[id^="edit-sell-price-${id}"]`)?.value);
    const rawQty = parseFloat(root.querySelector(`[id^="edit-qty-${id}"]`)?.value);
    const newUnit = root.querySelector(`[id^="edit-unit-${id}"]`)?.value;
    let newSize = parseFloat(root.querySelector(`[id^="edit-size-${id}"]`)?.value) || product.itemSize;

    const barcodeInput = root.querySelector(`[id^="edit-barcodes-${id}"]`);
    const newBarcodes = barcodeInput?.value
        .split(',')
        .map(b => b.trim())
        .filter(b => b !== '') || [];

    const promoToggle = root.querySelector(`input[id^="edit-promo-toggle-${id}"]`);
    const promoEnabled = promoToggle ? promoToggle.checked : product.promoEnabled;
    const promos = Array.from(root.querySelectorAll('.promo-list .promo-item')).map(row => ({
        qty: AppFinance.safeNum(row.querySelector('.promo-qty-val').value) || 0,
        price: AppFinance.round(row.querySelector('.promo-price-val').value) || 0
    })).filter(pr => pr.qty > 0);

    if (newUnit === 'pcs') newSize = 1;

    if (newName && !isNaN(newSellPrice) && !isNaN(rawQty)) {
        product.name = newName;
        product.qty = AppFinance.stock(rawQty); // Professional snapping
        product.itemSize = newSize;
        product.sellPrice = AppFinance.round(newSellPrice);
        product.unit = newUnit;
        product.barcodes = newBarcodes;
        product.barcode = newBarcodes[0] || ''; 
        product.promoEnabled = promoEnabled;
        product.promos = promos;
        
        editingId = null;
        saveState();
    }
}

// --- Restock Functions ---
function restockProduct(id) {
    restockingId = id;
    editingId = null;
    renderAll();
}

function cancelRestock() {
    restockingId = null;
    renderAll();
}

function saveRestock(id) {
    const product = state.products.find(p => p.id === id);
    if (!product) return;
    const newBags = parseFloat(document.getElementById(`restock-bags-${id}`).value);
    const newCost = parseFloat(document.getElementById(`restock-cost-${id}`).value);
    const newSellPrice = parseFloat(document.getElementById(`restock-sell-${id}`)?.value) || product.sellPrice || 0;
    const newPromoQty = parseFloat(document.getElementById(`restock-promo-qty-${id}`)?.value) || 0;
    const newPromoPrice = parseFloat(document.getElementById(`restock-promo-price-${id}`)?.value) || 0;
    _applyRestock(product, newBags, newCost, newSellPrice, newPromoQty, newPromoPrice);
}

function saveMobileRestock(id) {
    const product = state.products.find(p => p.id === id);
    if (!product) return;
    const newBags = parseFloat(document.getElementById(`restock-bags-${id}-m`).value);
    const newCost = parseFloat(document.getElementById(`restock-cost-${id}-m`).value);
    const newSellPrice = parseFloat(document.getElementById(`restock-sell-${id}-m`)?.value) || product.sellPrice || 0;
    const newPromoQty = parseFloat(document.getElementById(`restock-promo-qty-${id}-m`)?.value) || 0;
    const newPromoPrice = parseFloat(document.getElementById(`restock-promo-price-${id}-m`)?.value) || 0;
    _applyRestock(product, newBags, newCost, newSellPrice, newPromoQty, newPromoPrice);
}

async function _applyRestock(product, newBags, newCost, newSellPrice, newPromoQty = 0, newPromoPrice = 0) {
    if (isNaN(newBags) || newBags <= 0 || isNaN(newCost) || newCost < 0) {
        alert('Please enter valid values.');
        return;
    }
    const addedQty = newBags * (product.itemSize || 1);
    const unitCost = addedQty > 0 ? newCost / addedQty : 0;
    const batchSellPrice = newSellPrice || product.sellPrice || 0;

    if (!product.batches) product.batches = [];
    product.batches.push({
        id: Date.now(),
        qty: addedQty,
        cost: unitCost,
        sellPrice: AppFinance.round(batchSellPrice),
        promoQty: Math.round(newPromoQty),
        promoPrice: AppFinance.round(newPromoPrice),
        date: new Date().toISOString()
    });

    product.qty = AppFinance.stock(product.qty + addedQty);
    product.initialQty = (product.initialQty || 0) + addedQty;
    product.totalCost = (product.totalCost || 0) + newCost;
    product.unitCost = product.totalCost / product.initialQty;
    product.itemCount = (product.itemCount || 0) + newBags;
    // Update product-level sell price to latest batch
    product.sellPrice = AppFinance.round(batchSellPrice);

    // Sync to global product promos for the sales form
    if (newPromoQty > 0 && newPromoPrice > 0) {
        product.promoEnabled = true;
        if (!product.promos) product.promos = [];
        // If promo with same qty exists, update it, otherwise add new
        const existing = product.promos.find(pr => pr.qty === newPromoQty);
        if (existing) {
            existing.price = AppFinance.round(newPromoPrice);
        } else {
            product.promos.push({ qty: newPromoQty, price: AppFinance.round(newPromoPrice) });
        }
    }

    restockingId = null;
    saveState();
    await customAlert(`✅ تم بنجاح! الكمية الجديدة: ${formatQty(product.qty, product.unit)}`);
}

/**
 * Professional FIFO Sell Engine
 * Executes stock deduction across batches with absolute precision.
 * Uses internal integer arithmetic to prevent floating-point artifacts.
 */
function sellFIFO(product, qtyInput, revenueOnly = false) {
    const internalQtyToSell = AppFinance.toInternal(qtyInput);
    if (internalQtyToSell <= 0) return { revenue: 0, cost: 0 };

    const batches = revenueOnly
        ? JSON.parse(JSON.stringify(product.batches || []))
        : (product.batches || []);

    // Fallback if no batches exist
    if (!batches || batches.length === 0) {
        const bSell = product.sellPrice || 0;
        const bCost = product.unitCost || 0;
        const bestPromo = AppFinance.getBestPromo(product, qtyInput);
        let revenue = 0;

        if (bestPromo && bestPromo.qty > 1) {
            const internalPromoQty = AppFinance.toInternal(bestPromo.qty);
            const pairs = Math.floor(internalQtyToSell / internalPromoQty);
            const internalRemainder = internalQtyToSell % internalPromoQty;
            const remainder = AppFinance.toExternal(internalRemainder);
            
            revenue = Math.round(pairs * bestPromo.price + remainder * bSell);
        } else {
            revenue = Math.round(AppFinance.toExternal(internalQtyToSell) * bSell);
        }

        if (!revenueOnly) {
            const currentInternalQty = AppFinance.toInternal(product.qty);
            product.qty = AppFinance.toExternal(currentInternalQty - internalQtyToSell);
        }
        return { revenue, cost: Math.round(AppFinance.toExternal(internalQtyToSell) * bCost) };
    }

    batches.sort((a, b) => new Date(a.date) - new Date(b.date));

    let internalRemaining = internalQtyToSell;
    let totalCost = 0;
    let collectedItems = []; // [{qtyInternal, sellPrice, cost}]

    for (const batch of batches) {
        if (internalRemaining <= 0) break;
        const internalBatchQty = AppFinance.toInternal(batch.qty);
        if (internalBatchQty <= 0) continue;

        const internalTake = Math.min(internalBatchQty, internalRemaining);
        const bSell = batch.sellPrice || product.sellPrice || 0;
        const bCost = batch.cost || product.unitCost || 0;

        collectedItems.push({ 
            qty: AppFinance.toExternal(internalTake), 
            sellPrice: bSell, 
            cost: bCost 
        });

        totalCost += Math.round(AppFinance.toExternal(internalTake) * bCost);
        
        if (!revenueOnly) {
            batch.qty = AppFinance.toExternal(internalBatchQty - internalTake);
        }
        internalRemaining -= internalTake;
    }

    // Revenue Calculation
    let totalRevenue = 0;
    const bestPromo = AppFinance.getBestPromo(product, qtyInput);

    if (bestPromo && bestPromo.qty > 1) {
        const internalPromoQty = AppFinance.toInternal(bestPromo.qty);
        const pairs = Math.floor(internalQtyToSell / internalPromoQty);
        const internalRemainder = internalQtyToSell % internalPromoQty;
        const remainder = AppFinance.toExternal(internalRemainder);
        
        totalRevenue = pairs * bestPromo.price;
        if (internalRemainder > 0) {
            totalRevenue += Math.round(remainder * (product.sellPrice || 0));
        }
    } else {
        for (const item of collectedItems) {
            totalRevenue += Math.round(item.qty * item.sellPrice);
        }
    }

    if (!revenueOnly) {
        product.batches = product.batches.filter(b => AppFinance.toInternal(b.qty) > 0);
        const currentInternalQty = AppFinance.toInternal(product.qty);
        product.qty = AppFinance.toExternal(currentInternalQty - internalQtyToSell);
    }

    return { revenue: Math.round(totalRevenue), cost: Math.round(totalCost) };
}


/** Backwards-compatible wrapper — returns cost only and deducts stock */
function deductFIFO(product, qty) {
    return sellFIFO(product, qty).cost;
}


// Sales
function toggleSaleMode(mode) {
    const qtyInput = document.getElementById('s-qty');
    const amtInput = document.getElementById('s-amount');
    const qtyLabel = document.getElementById('qty-label');
    const lang = localStorage.getItem('lang') || 'en';

    if (mode === 'amt') {
        document.getElementById('amt-input-group').style.display = 'block';
        qtyInput.parentElement.style.display = 'none';
        qtyInput.required = false;
        amtInput.required = true;
    } else if (mode === 'gram') {
        document.getElementById('amt-input-group').style.display = 'none';
        qtyInput.parentElement.style.display = 'block';
        qtyInput.required = true;
        amtInput.required = false;
        qtyLabel.innerText = translations[lang]?.lbl_qty_g || 'Quantity (g)';
    } else {
        document.getElementById('amt-input-group').style.display = 'none';
        qtyInput.parentElement.style.display = 'block';
        qtyInput.required = true;
        amtInput.required = false;
        qtyLabel.innerText = translations[lang]?.lbl_qty || 'Quantity';
    }
    updateSalePreview();
}

// ============================================
// NEW CLEAN SALE FORM LOGIC
// ============================================
function onSaleProductChange(val) {
    const customGroup = document.getElementById('custom-product-group');
    const modeGroup = document.getElementById('sale-mode-group');
    const amtGroup = document.getElementById('amt-input-group');
    const preview = document.getElementById('sale-total-preview');

    // Reset
    customGroup.style.display = 'none';
    modeGroup.style.display = 'none';
    amtGroup.style.display = 'none';
    preview.style.display = 'none';
    preview.innerHTML = '';
    document.getElementById('qty-label').innerText = 'الكمية / Quantity';
    const qtyRadio = document.querySelector('input[name="sale-mode"][value="qty"]');
    if (qtyRadio) qtyRadio.checked = true;

    if (!val) return;

    if (val === 'custom') {
        customGroup.style.display = 'block';
        return;
    }

    const product = state.products.find(p => p.id === parseInt(val));
    if (!product) return;

    if (product.unit === 'kg' || product.unit === 'g') {
        modeGroup.style.display = 'block';
        const defaultMode = product.unit === 'g' ? 'gram' : 'qty';
        const r = document.querySelector(`input[name="sale-mode"][value="${defaultMode}"]`);
        if (r) { r.checked = true; toggleSaleMode(defaultMode); }
    }
    onSaleQtyInput();
}

function onSaleQtyInput() {
    const val = document.getElementById('s-product').value;
    const saleMode = document.querySelector('input[name="sale-mode"]:checked')?.value || 'qty';
    const preview = document.getElementById('sale-total-preview');

    if (!val) return;

    let total = 0;
    if (val === 'custom') {
        const unitPrice = parseFloat(document.getElementById('s-custom-price').value) || 0;
        const qty = parseFloat(document.getElementById('s-qty').value) || 0;
        total = qty * unitPrice;
    } else {
        const product = state.products.find(p => p.id === parseInt(val));
        if (!product) return;

        const bagPrice = product.sellPrice || 0;
        const itemSize = product.itemSize || 1;
        const unitPrice = bagPrice / itemSize;

        if (saleMode === 'amt') {
            total = parseFloat(document.getElementById('s-amount').value) || 0;
            // Logic to show expected qty if amount matches a promo
            const bestPromo = product.promoEnabled && product.promos?.find(pr => AppFinance.round(pr.price) === AppFinance.round(total));
            if (bestPromo) {
                preview.style.display = 'block';
                preview.innerHTML = `<span style="color:var(--primary); font-weight:700;">PROMO: ${formatQty(bestPromo.qty, product.unit)}</span>`;
                return;
            }
        } else if (saleMode === 'gram') {
            const grams = parseFloat(document.getElementById('s-qty').value) || 0;
            const qty = product.unit === 'kg' ? AppFinance.safeNum(grams / 1000) : AppFinance.safeNum(grams);
            total = AppFinance.round(qty * unitPrice);
        } else {
            const rawQty = parseFloat(document.getElementById('s-qty').value) || 0;
            const qty = AppFinance.safeNum(rawQty);
            
            if (qty > 0 && product.batches && product.batches.length > 0) {
                total = sellFIFO(product, qty, true).revenue;
            } else {
                const bestPromo = AppFinance.getBestPromo(product, qty);
                if (bestPromo && bestPromo.qty > 1) {
                    const iQty = AppFinance.toInternal(qty);
                    const iPromo = AppFinance.toInternal(bestPromo.qty);
                    const pairs = Math.floor(iQty / iPromo);
                    const iRemainder = iQty % iPromo;
                    const remainder = AppFinance.toExternal(iRemainder);
                    total = pairs * bestPromo.price + remainder * unitPrice;
                } else {
                    total = qty * unitPrice;
                }
            }
        }
    }

    if (total > 0) {
        preview.style.display = 'block';
        preview.innerHTML = `الإجمالي: <span dir="ltr">${AppFinance.round(total).toLocaleString()} DA</span>`;
    } else {
        preview.style.display = 'none';
    }
}

document.getElementById('sale-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const val = document.getElementById('s-product').value;
    const saleMode = document.querySelector('input[name="sale-mode"]:checked')?.value || 'qty';
    const isPast = document.getElementById('s-is-past').checked;
    const rawDate = document.getElementById('s-date').value;

    // Build display date
    let displayDate = new Date().toLocaleDateString();
    if (isPast && rawDate) {
        const [y, m, d] = rawDate.split('-');
        displayDate = new Date(+y, +m - 1, +d).toLocaleDateString();
    }

    if (!val) return alert('الرجاء اختيار منتج');

    let saleObj;

    // ---- CUSTOM / EXTERNAL ITEM ----
    if (val === 'custom') {
        const name = document.getElementById('s-custom-name').value.trim();
        const unit = document.getElementById('s-custom-unit').value || 'pcs';
        const unitPrice = parseFloat(document.getElementById('s-custom-price').value) || 0;
        const qty = parseFloat(document.getElementById('s-qty').value) || 0;

        if (!name) return alert('الرجاء إدخال اسم المنتج');
        if (unitPrice <= 0) return alert('الرجاء إدخال سعر صحيح');
        if (qty <= 0) return alert('الرجاء إدخال كمية صحيحة');

        const total = AppFinance.round(qty * unitPrice);

        saleObj = {
            id: Date.now(), productId: -2,
            productName: name, qty, unit,
            price: unitPrice, costAtSale: 0,
            total, date: displayDate
        };

        // ---- REGULAR INVENTORY PRODUCT ----
    } else {
        const product = state.products.find(p => p.id === parseInt(val));
        if (!product) return alert('منتج غير موجود');

        const bagPrice = product.sellPrice || 0;
        const unitPrice = bagPrice / (product.itemSize || 1);
        let qty, total;
        let costAtSale = 0;

        if (saleMode === 'amt') {
            total = parseFloat(document.getElementById('s-amount').value) || 0;
            // Check if this total amount corresponds to a promotion
            const bestPromo = product.promoEnabled && product.promos?.find(pr => AppFinance.round(pr.price) === AppFinance.round(total));
            if (bestPromo) {
                qty = AppFinance.safeNum(bestPromo.qty);
            } else {
                qty = unitPrice > 0 ? AppFinance.safeNum(total / unitPrice) : 0;
            }
            
            if (!isPast && qty > 0) costAtSale = deductFIFO(product, qty);
            else costAtSale = AppFinance.round(qty * (product.unitCost || 0));
        } else if (saleMode === 'gram') {
            const grams = parseFloat(document.getElementById('s-qty').value) || 0;
            qty = product.unit === 'kg' ? AppFinance.safeNum(grams / 1000) : AppFinance.safeNum(grams);
            total = AppFinance.round(qty * unitPrice);
            if (!isPast && qty > 0) costAtSale = deductFIFO(product, qty);
            else costAtSale = Math.round(qty * (product.unitCost || 0));
        } else {
            qty = AppFinance.safeNum(parseFloat(document.getElementById('s-qty').value) || 0);

            if (!isPast) {
                if (AppFinance.toInternal(product.qty) < AppFinance.toInternal(qty)) {
                    return alert(`❌ الكمية المتاحة فقط ${formatQty(product.qty, product.unit)}`);
                }
                // sellFIFO: deducts stock AND returns batch-accurate revenue + cost
                const result = sellFIFO(product, qty);
                total = result.revenue;
                costAtSale = result.cost;
            } else {
                // Past sale: use current product pricing, no stock deduction
                const bestPromo = AppFinance.getBestPromo(product, qty);
                if (bestPromo && bestPromo.qty > 1) {
                    const iQty = AppFinance.toInternal(qty);
                    const iPromo = AppFinance.toInternal(bestPromo.qty);
                    const pairs = Math.floor(iQty / iPromo);
                    const iRemainder = iQty % iPromo;
                    const remainder = AppFinance.toExternal(iRemainder);
                    total = AppFinance.round(pairs * bestPromo.price + remainder * unitPrice);
                } else {
                    total = AppFinance.round(qty * unitPrice);
                }
                costAtSale = Math.round(qty * (product.unitCost || 0));
            }
        }

        if (qty <= 0) return alert('الرجاء إدخال كمية صحيحة');
        if (total <= 0) return alert('السعر = 0، راجع المنتج');

        saleObj = {
            id: Date.now(), productId: product.id,
            productName: product.name, qty, unit: product.unit,
            price: (product.sellPrice || 0) / (product.itemSize || 1),
            total, date: displayDate,
            cost: costAtSale,
            isPast: isPast
        };
    }

    state.sales.push(saleObj);
    e.target.reset();

    // Reset UI
    document.getElementById('custom-product-group').style.display = 'none';
    document.getElementById('sale-mode-group').style.display = 'none';
    document.getElementById('amt-input-group').style.display = 'none';
    document.getElementById('sale-total-preview').style.display = 'none';
    document.getElementById('s-date-container').style.display = 'none';
    document.getElementById('sale-total-preview').innerHTML = '';

    saveState();
});





function deleteSale(id) {
    const index = state.sales.findIndex(s => s.id === id);
    if (index !== -1) {
        const sale = state.sales[index];
        // Restock only if it was a real product and NOT a past sale
        if (sale.productId > 0 && !sale.isPast) {
            const product = state.products.find(p => p.id === sale.productId);
            if (product) {
                product.qty = AppFinance.stock(product.qty + sale.qty);
                // [BUG-10 FIXED] Restore FIFO batch integrity on sale delete.
                // Without this, qty is returned but batches[] stays empty, skewing all future FIFO cost calculations.
                if (!product.batches) product.batches = [];
                const unitCostAtSale = (sale.cost && sale.qty > 0) ? AppFinance.safeNum(sale.cost / sale.qty) : (product.unitCost || 0);
                product.batches.push({
                    id: Date.now(),
                    qty: sale.qty,
                    cost: unitCostAtSale,
                    sellPrice: product.sellPrice || 0,
                    date: new Date().toISOString()
                });
            }
        }
        state.trash.sales.push(state.sales.splice(index, 1)[0]);
        saveState();
    }
}

async function returnSale(id) {
    const index = state.sales.findIndex(s => s.id === id);
    if (index === -1) return;
    const sale = state.sales[index];

    const qToReturn = await customReturn(sale);
    if (qToReturn === null) return;

    const lang = localStorage.getItem('lang') || 'ar';

    // RESTOCK LOGIC
    // Only restock if it was a real product and NOT a past sale
    if (sale.productId > 0 && !sale.isPast) {
        const product = state.products.find(p => p.id === sale.productId);
        if (product) {
            product.qty = AppFinance.stock(product.qty + qToReturn);
        }
    }

    // Calculate values
    const avgPrice = sale.total / sale.qty;
    const refundAmount = AppFinance.round(qToReturn * avgPrice);

    if (qToReturn === sale.qty) {
        // Full return -> move to trash
        state.trash.sales.push(state.sales.splice(index, 1)[0]);
    } else {
        // Partial return -> Update existing sale
        const avgCostAtSale = (sale.cost || 0) / (sale.qty || 1);
        const costToReturn = Math.round(qToReturn * avgCostAtSale);
        sale.qty = AppFinance.stock(sale.qty - qToReturn);
        sale.total = AppFinance.round(sale.total - refundAmount);
        sale.cost = Math.round((sale.cost || 0) - costToReturn);
        // We could also record a "RETURN" entry in trash if we want a trail
    }

    saveState();

    // Feedback
    const successMsg = lang === 'ar'
        ? `✅ تمت العملية: تم إرجاع ${qToReturn} ${sale.unit} للمخزن`
        : `✅ Success: Returned ${qToReturn} ${sale.unit} to stock`;
    showToast(successMsg, 'success');
}

async function returnCredit(id) {
    const index = state.credits.findIndex(c => c.id === id);
    if (index === -1) return;
    const credit = state.credits[index];

    // Map credit to a 'sale-like' object for customReturn UI
    const pseudoSale = {
        productName: credit.customerName + " | " + credit.productName,
        qty: credit.qty,
        total: credit.total,
        unit: credit.unit || 'pcs'
    };

    const qToReturn = await customReturn(pseudoSale);
    if (qToReturn === null) return;

    const lang = localStorage.getItem('lang') || 'ar';

    // 1. Restock the product only if NOT past credit
    if (!credit.isPast) {
        const product = state.products.find(p => p.id === credit.productId);
        if (product) {
            product.qty = AppFinance.stock(product.qty + qToReturn);
        }
    }

    // 2. Calculate values
    const avgPrice = credit.total / credit.qty;
    const refundAmount = AppFinance.round(qToReturn * avgPrice);
    const avgCostAtSale = (credit.cost || 0) / (credit.qty || 1);
    const costToReturn = Math.round(qToReturn * avgCostAtSale);

    if (qToReturn === credit.qty) {
        // Full return -> move to trash
        state.trash.credits.push(state.credits.splice(index, 1)[0]);
    } else {
        // Partial return -> Update existing credit
        credit.qty = AppFinance.stock(credit.qty - qToReturn);
        credit.total = AppFinance.round(credit.total - refundAmount);
        credit.cost = Math.round((credit.cost || 0) - costToReturn);
    }

    saveState();

    const successMsg = lang === 'ar'
        ? `✅ تمت العملية: تم إرجاع ${qToReturn} ${credit.unit} من الدين للمخزن`
        : `✅ Success: Returned ${qToReturn} ${credit.unit} from credit to stock`;
    showToast(successMsg, 'success');
}

function startPastSaleScanner() {
    startCameraScanner(handlePastSaleScan);
}

async function handlePastSaleScan(code) {
    if (!code) return;
    // Search all products for this barcode
    const product = state.products.find(p => (p.barcodes || []).includes(code) || p.barcode === code);
    if (product) {
        document.getElementById('s-past-name').value = product.name;
        document.getElementById('s-past-cost').value = (product.unitCost || 0).toFixed(2);
        document.getElementById('s-past-sell').value = product.sellPrice.toFixed(2);
        document.getElementById('s-past-unit').value = product.unit;

        // Visual feedback
        const input = document.getElementById('s-past-barcode');
        input.style.borderColor = 'var(--success)';
        setTimeout(() => input.style.borderColor = '', 1000);

        // Stop scanner if it was open
        stopCameraScanner();
        showToast(product.name + ' auto-filled', 'success');
    }
}

// Expenses
document.getElementById('expense-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const expense = {
        id: Date.now(),
        desc: document.getElementById('e-desc').value,
        amount: Math.round(parseFloat(document.getElementById('e-amount').value) || 0),
        date: new Date().toLocaleDateString()
    };
    state.expenses.push(expense);
    e.target.reset();
    saveState();
});

function deleteExpense(id) {
    const index = state.expenses.findIndex(e => e.id === id);
    if (index !== -1) {
        state.trash.expenses.push(state.expenses.splice(index, 1)[0]);
        saveState();
    }
}

// --- Credits Logic ---
function toggleCrSaleMode(mode) {
    const qtyInput = document.getElementById('cr-qty');
    const amtInput = document.getElementById('cr-amount');
    const qtyLabel = document.getElementById('cr-qty-label');
    const lang = localStorage.getItem('lang') || 'en';

    if (mode === 'amt') {
        document.getElementById('cr-amt-input-group').style.display = 'block';
        qtyInput.parentElement.style.display = 'none';
        qtyInput.required = false;
        amtInput.required = true;
    } else if (mode === 'gram') {
        document.getElementById('cr-amt-input-group').style.display = 'none';
        qtyInput.parentElement.style.display = 'block';
        qtyInput.required = true;
        amtInput.required = false;
        qtyLabel.innerText = translations[lang]?.lbl_qty_g || 'Quantity (g)';
    } else {
        document.getElementById('cr-amt-input-group').style.display = 'none';
        qtyInput.parentElement.style.display = 'block';
        qtyInput.required = true;
        amtInput.required = false;
        qtyLabel.innerText = translations[lang]?.lbl_qty || 'Quantity';
    }
    updateCrSalePreview();
}

document.getElementById('cr-product').addEventListener('change', (e) => {
    const val = e.target.value;
    const modeGroup = document.getElementById('cr-sale-mode-group');
    if (!val) { modeGroup.style.display = 'none'; return; }

    const productId = parseInt(val);
    const product = state.products.find(p => p.id === productId);

    if (product && (product.unit === 'kg' || product.unit === 'g')) {
        modeGroup.style.display = 'block';
        const defaultMode = product.unit === 'g' ? 'gram' : 'qty';
        const radioToCheck = document.querySelector(`input[name="cr-sale-mode"][value="${defaultMode}"]`);
        if (radioToCheck) radioToCheck.checked = true;
        toggleCrSaleMode(defaultMode);
    } else {
        modeGroup.style.display = 'none';
        toggleCrSaleMode('qty');
        const radioToCheck = document.querySelector('input[name="cr-sale-mode"][value="qty"]');
        if (radioToCheck) radioToCheck.checked = true;
    }
    updateCrSalePreview();
});

document.getElementById('cr-qty').addEventListener('input', updateCrSalePreview);
document.getElementById('cr-amount').addEventListener('input', updateCrSalePreview);

function updateCrSalePreview() {
    const val = document.getElementById('cr-product').value;
    if (!val) return;
    const productId = parseInt(val);
    const product = state.products.find(p => p.id === productId);
    const saleMode = document.querySelector('input[name="cr-sale-mode"]:checked')?.value || 'qty';
    const previewEl = document.getElementById('cr-total-preview');
    if (!previewEl) return;

    const bagPrice = product ? (product.sellPrice || 0) : 0;
    const unitPrice = product ? (bagPrice / (product.itemSize || 1)) : 0;

    if (product && (product.unit === 'kg' || product.unit === 'g') && saleMode === 'amt') {
        const amount = parseFloat(document.getElementById('cr-amount').value) || 0;
        const qty = unitPrice > 0 ? AppFinance.safeNum(amount / unitPrice) : 0;
        let display = "";
        if (product.unit === 'kg') {
            const grams = (qty * 1000).toFixed(0);
            display = `${qty.toFixed(3)} Kg <br> <span style="font-size: 0.8rem; color:var(--secondary);">${grams}g</span>`;
        } else {
            display = `${qty.toFixed(0)} g`;
        }
        previewEl.innerHTML = `<span style="font-size: 0.9rem;">To Deduct:</span><br>${display}`;
    } else if (product && (product.unit === 'kg' || product.unit === 'g') && saleMode === 'gram') {
        const grams = parseFloat(document.getElementById('cr-qty').value) || 0;
        const qty = product.unit === 'kg' ? grams / 1000 : grams;
        const total = qty * unitPrice;
        previewEl.innerHTML = `<span style="font-size: 0.9rem;">Total Debt:</span><br><span dir="ltr">${Math.round(total).toLocaleString()} DA</span>`;
    } else {
        const qtyInputVal = parseFloat(document.getElementById('cr-qty').value) || 0;
        let totalPrice = qtyInputVal * unitPrice;

        // Add Bulk Promo Logic to Credit Preview
        const bestPromo = AppFinance.getBestPromo(product, qtyInputVal);
        if (bestPromo && bestPromo.qty > 1) {
            const pairs = Math.floor(qtyInputVal / bestPromo.qty);
            const remainder = qtyInputVal % bestPromo.qty;
            totalPrice = pairs * bestPromo.price + remainder * unitPrice;
        } else {
            totalPrice = qtyInputVal * unitPrice;
        }

        previewEl.innerHTML = `<span style="font-size: 0.9rem;">Total Debt:</span><br><span dir="ltr">${Math.round(totalPrice).toLocaleString()} DA</span>`;
    }
}

document.getElementById('credit-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const val = document.getElementById('cr-product').value;
    if (!val) return alert("Please select a product.");

    const saleMode = document.querySelector('input[name="cr-sale-mode"]:checked')?.value || 'qty';
    const isPast = document.getElementById('cr-is-past').checked;
    const rawDate = document.getElementById('cr-date').value;
    let displayDate = new Date().toLocaleDateString();

    if (isPast && rawDate) {
        const parts = rawDate.split('-');
        if (parts.length === 3) {
            displayDate = new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString();
        } else {
            displayDate = new Date(rawDate).toLocaleDateString();
        }
    }

    const productId = parseInt(val);
    const product = state.products.find(p => p.id === productId);
    if (!product) return alert("Select a valid product.");

    let qty, total;
    const bagPrice = product.sellPrice || 0;
    const unitPrice = bagPrice / (product.itemSize || 1);

    if (product.unit !== 'pcs' && saleMode === 'amt') {
        total = parseFloat(document.getElementById('cr-amount').value);
        qty = total / unitPrice;
    } else if ((product.unit === 'kg' || product.unit === 'g') && saleMode === 'gram') {
        const grams = parseFloat(document.getElementById('cr-qty').value);
        qty = product.unit === 'kg' ? grams / 1000 : grams;
        total = qty * unitPrice;
    } else {
        qty = parseFloat(document.getElementById('cr-qty').value);

        // CORRECT promo revenue: (full sets × promo price) + (remainder × unit price)
        const bestPromo = AppFinance.getBestPromo(product, qty);
        if (bestPromo && bestPromo.qty > 1) {
            const pairs = Math.floor(qty / bestPromo.qty);
            const remainder = qty % bestPromo.qty;
            total = AppFinance.round(pairs * bestPromo.price + remainder * unitPrice);
        } else {
            total = AppFinance.round(qty * unitPrice);
        }
    }

    if (AppFinance.toInternal(product.qty) < AppFinance.toInternal(qty)) { // [BUG-9 FIXED] Raw float < caused false 'insufficient stock' for kg/g products due to floating-point drift
        const msg = document.documentElement.lang === 'ar'
            ? `❌ خطأ: المخزون لا يكفي للدين!\nالكمية المتاحة: ${Math.round(product.qty)} ${product.unit}`
            : `❌ Error: Not enough stock for this credit!\nAvailable: ${Math.round(product.qty)} ${product.unit}`;
        alert(msg);
        return;
    }

    const customerName = document.getElementById('cr-customer').value.trim();

    // FIFO cost snapshot for credit
    let creditCost = 0;
    if (!isPast) {
        creditCost = deductFIFO(product, qty); // deducts stock AND returns FIFO cost
    } else {
        creditCost = Math.round(qty * (product.unitCost || 0));
    }

    const creditObj = {
        id: Date.now(),
        customerId: Date.now() + "-cust",
        customerName: customerName,
        productId: productId,
        productName: product.name,
        qty: qty,
        unit: product.unit,
        price: unitPrice,
        cost: creditCost,
        total: total,
        date: displayDate,
        originalDate: displayDate,
        isPast: isPast
    };

    // Stock already deducted inside deductFIFO above for live credits

    state.credits.push(creditObj);
    e.target.reset();

    // Reset UI states
    document.getElementById('cr-is-past').checked = false;
    document.getElementById('cr-date-container').style.display = 'none';
    document.getElementById('cr-total-preview').innerHTML = '';
    toggleCrSaleMode('qty');

    saveState();
});

function deleteCredit(id) {
    const index = state.credits.findIndex(c => c.id === id);
    if (index !== -1) {
        const credit = state.credits[index];
        // Restock only if NOT past credit
        if (!credit.isPast) {
            const product = state.products.find(p => p.id === credit.productId);
            if (product) {
                product.qty = AppFinance.stock(product.qty + credit.qty);
            }
        }
        state.trash.credits.push(state.credits.splice(index, 1)[0]);
        saveState();
    }
}

async function payCredit(id) { // [BUG-4 FIXED] Made async — confirm() is blocked in PWA standalone mode
    const credit = state.credits.find(c => c.id === id);
    if (!credit) return;

    const lang = localStorage.getItem('lang') || 'en';
    const msg = lang === 'ar'
        ? `هل أنت متأكد من استلام مبلغ (${credit.total} دينار) من ${credit.customerName}؟`
        : `Are you sure you received (${credit.total} DA) from ${credit.customerName}?`;

    if (await customConfirm(msg)) { // [BUG-4 FIXED] Replaced confirm() with customConfirm()
        const paymentDate = new Date().toLocaleDateString();

        const saleObj = {
            id: Date.now(),
            productId: credit.productId,
            productName: credit.productName,
            qty: credit.qty,
            unit: credit.unit,
            price: credit.price,
            total: credit.total,
            cost: credit.cost || 0,
            date: paymentDate,
            isPast: credit.isPast // Carry over isPast status
        };

        state.sales.push(saleObj);
        state.credits = state.credits.filter(c => c.id !== id);
        saveState();
    }
}

function renderCredits() {
    const crSelect = document.getElementById('cr-product');
    const savedCrVal = crSelect.value;
    const lang = localStorage.getItem('lang') || 'en';
    crSelect.innerHTML = `<option value="">${translations[lang]?.sel_product || 'Select Product...'}</option>` +
        state.products.map(p => `<option value="${p.id}">${p.name} (Stock: ${p.qty})</option>`).join('');
    crSelect.value = savedCrVal;

    let totalUnpaid = 0;
    let expectedProfit = 0;

    const getUnitCost = (c) => {
        let p = state.products.find(p => p.id === c.productId) || state.trash.products.find(p => p.id === c.productId);
        return p ? (p.unitCost || 0) : 0;
    };

    const searchInput = document.getElementById('credit-search');
    let searchQuery = '';
    if (searchInput) {
        searchQuery = searchInput.value.toLowerCase().trim();
        if (!searchInput.dataset.listenerAdded) {
            searchInput.addEventListener('input', renderAll);
            searchInput.dataset.listenerAdded = 'true';
        }
    }

    const filteredCredits = state.credits.filter(c => {
        totalUnpaid += c.total;
        const margin = c.total - (c.qty * getUnitCost(c));
        expectedProfit += margin;

        if (!searchQuery) return true;
        return c.customerName.toLowerCase().includes(searchQuery);
    });

    document.getElementById('stat-total-credit').innerHTML = `<span dir="ltr">${totalUnpaid.toLocaleString()} DA</span>`;
    document.getElementById('stat-credit-profit').innerHTML = `<span dir="ltr">${expectedProfit.toLocaleString()} DA</span>`;

    const creditsList = document.getElementById('credits-list');
    if (filteredCredits.length === 0) {
        creditsList.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--secondary);">${translations[lang]?.txt_no_credits || 'No unpaid credits.'}</td></tr>`;
    } else {
        creditsList.innerHTML = filteredCredits.reverse().map(c => `
                    <tr>
                        <td>${c.date}</td>
                        <td style="font-weight: bold;">${c.customerName}</td>
                        <td>${c.productName} <br><span dir="ltr" style="font-size: 0.8rem; color: var(--secondary);">${Math.round(c.qty)} ${c.unit || 'pcs'}</span></td>
                        <td><span dir="ltr" class="privacy-value">${c.total.toLocaleString()} DA</span></td>
                        <td style="display: flex; gap: 0.5rem; justify-content: center;">
                            <button class="delete-btn" style="color: white; padding: 0.25rem 0.5rem; background: var(--success); border-radius: 4px;" onclick="payCredit(${c.id})" title="Pay/تخليص"><i data-lucide="check" style="width: 14px; height: 14px;"></i></button>
                            <button class="delete-btn" style="color: white; padding: 0.25rem 0.5rem; background: var(--secondary); border-radius: 4px;" onclick="returnCredit(${c.id})" title="Return/إرجاع"><i data-lucide="pencil" style="width: 14px; height: 14px;"></i></button>
                            <button class="delete-btn" onclick="deleteCredit(${c.id})" title="Delete/حذف"><i data-lucide="trash-2" style="width: 16px; height: 16px;"></i></button>
                        </td>
                    </tr>
                `).join('');
    }
}

// --- Trash Functions ---
function restoreItem(type, id) {
    const list = state.trash[type];
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
        state[type].push(list.splice(index, 1)[0]);
        saveState();
    }
}

function permanentDelete(type, id) {
    state.trash[type] = state.trash[type].filter(item => item.id !== id);
    saveState();
}

async function emptyTrash(category) { // [BUG-5 FIXED] Made async — confirm() is blocked in PWA standalone mode
    if (await customConfirm('Are you sure you want to permanently delete these items?')) { // [BUG-5 FIXED]
        if (category === 'products') {
            state.trash.products = [];
        } else {
            state.trash.sales = [];
            state.trash.expenses = [];
            state.trash.credits = [];
        }
        saveState();
    }
}

// --- Database Management (Backup) ---
function downloadBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `AnimalLand_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(dlAnchorElem);
    dlAnchorElem.click();
    document.body.removeChild(dlAnchorElem);
}

async function restoreBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedState = JSON.parse(e.target.result);
            if (importedState.products && importedState.sales) {
                if (confirm("Are you sure you want to replace ALL current data with this backup?")) {
                    state = importedState;
                    saveState();
                    alert("Database restored successfully! The page will now reload.");
                    location.reload();
                }
            } else {
                alert("Invalid backup file format. Missing core properties.");
            }
        } catch (err) {
            alert("Error reading backup file format. Is it a valid JSON?");
        }
        document.getElementById('db-upload').value = ""; // Reset input
    };
    reader.readAsText(file);
}

// --- Rendering ---
let myChart;

function renderAll() {
    const lang = localStorage.getItem('lang') || 'en';
    // Stats
    const now = new Date();
    const todayStr = now.toLocaleDateString();

    let totalRevenue = 0, totalExpensesVal = 0;
    let todayRevenue = 0, todayExp = 0;
    let monthRevenue = 0, monthExp = 0;

    const getUnitCost = (s) => {
        if (s.productId === -2 && s.costAtSale !== undefined) return s.costAtSale;
        let p = state.products.find(p => p.id === s.productId) || state.trash.products.find(p => p.id === s.productId);
        return p ? (p.unitCost || 0) : 0;
    };

    let totalProfit = 0;
    let todayProfit = 0;
    let monthProfit = 0;

    // --- Core Sales & Profit Stats Engine ---
    state.sales.forEach(s => {
        // Use locked cost if available, otherwise fallback to current WAC
        let cost;
        if (s.cost !== undefined) {
            cost = s.cost;
        } else {
            const itemCost = getUnitCost(s);
            cost = AppFinance.round(itemCost * s.qty);
        }
        
        const profit = AppFinance.round(s.total - cost);

        totalRevenue = AppFinance.round(totalRevenue + s.total);
        totalProfit = AppFinance.round(totalProfit + profit);

        if (s.date === todayStr) {
            todayRevenue = AppFinance.round(todayRevenue + s.total);
            todayProfit = AppFinance.round(todayProfit + profit);
        }

        const sD = parseDateSafety(s.date);
        if (isFinite(sD) && sD.getMonth() === now.getMonth() && sD.getFullYear() === now.getFullYear()) { // [BUG-17 FIXED] isNaN(Date) is unreliable — isFinite() correctly detects Invalid Date
            monthRevenue = AppFinance.round(monthRevenue + s.total);
            monthProfit = AppFinance.round(monthProfit + profit);
        }
    });

    state.expenses.forEach(e => {
        totalExpensesVal += e.amount;
        totalProfit -= e.amount;

        if (e.date === todayStr) {
            todayExp += e.amount;
            todayProfit -= e.amount;
        }

        const eD = parseDateSafety(e.date);
        if (isFinite(eD) && eD.getMonth() === now.getMonth() && eD.getFullYear() === now.getFullYear()) { // [BUG-17 FIXED]
            monthExp += e.amount;
            monthProfit -= e.amount;
        }
    });

    document.getElementById('stat-revenue').innerHTML = `<span dir="ltr">${totalRevenue.toLocaleString()} DA</span>`;
    document.getElementById('stat-expenses').innerHTML = `<span dir="ltr">${totalExpensesVal.toLocaleString()} DA</span>`;
    document.getElementById('stat-profit').innerHTML = `<span dir="ltr">${totalProfit.toLocaleString()} DA</span>`;
    document.getElementById('stat-profit-today').innerHTML = `<span dir="ltr">${todayProfit.toLocaleString()} DA</span>`;
    document.getElementById('stat-profit-month').innerHTML = `<span dir="ltr">${monthProfit.toLocaleString()} DA</span>`;

    // 2. Inventory List
    const invList = document.getElementById('inventory-list');
    const invCardsList = document.getElementById('inventory-cards-list');
    invList.innerHTML = '';
    if (invCardsList) invCardsList.innerHTML = '';

    const invSearchInput = document.getElementById('inventory-search');
    let invSearchQuery = '';
    if (invSearchInput) {
        invSearchQuery = invSearchInput.value.toLowerCase().trim();
        if (!invSearchInput.dataset.listenerAdded) {
            invSearchInput.addEventListener('input', renderAll);
            invSearchInput.dataset.listenerAdded = 'true';
        }
    }

    const filteredProducts = state.products.filter(p => {
        if (!invSearchQuery) return true;
        const nameMatch = p.name.toLowerCase().includes(invSearchQuery);
        const barcodesMatch = (p.barcodes || []).some(b => b.toLowerCase().includes(invSearchQuery));
        const oldBarcodeMatch = p.barcode && p.barcode.toLowerCase().includes(invSearchQuery);
        return nameMatch || barcodesMatch || oldBarcodeMatch;
    });

    filteredProducts.forEach(p => {
        const bagsLeftRaw = p.qty / (p.itemSize || 1);
        const bagsLeft = p.unit === 'pcs' ? Math.round(bagsLeftRaw) : parseFloat(bagsLeftRaw.toFixed(2));
        const isLow = p.unit === 'g' ? p.qty < 500 : (p.unit === 'kg' ? p.qty < 0.5 : p.qty < 5);

        // ---- EDITING ROW ----
        const editImgHtml = p.image
            ? `<img src="${p.image}" class="product-img-thumb" onclick="openCameraForProduct(${p.id})">`
            : `<div class="product-img-thumb empty" onclick="openCameraForProduct(${p.id})"><i data-lucide="camera" style="width:16px;"></i></div>`;

        if (editingId === p.id) {
            const editRow = `
                        <tr class="product-edit-root">
                            <td style="width: 60px;">${editImgHtml}</td>
                            <td style="width: 250px;">
                                <input type="text" id="edit-name-${p.id}" value="${p.name}" style="width: 100%; font-weight:800; margin-bottom:0.4rem; padding:0.4rem; border-color:var(--primary);"><br>
                                <label style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Barcodes</label>
                                <input type="text" id="edit-barcodes-${p.id}" value="${(p.barcodes || [p.barcode || '']).join(', ')}" style="width: 100%; font-size:0.8rem; font-family:monospace; padding:0.3rem;">
                            </td>
                            <td style="width: 180px;">
                                <div style="display:flex; flex-direction:column; gap:0.4rem;">
                                    <div style="display:flex; gap:0.3rem;">
                                        <input type="number" step="0.001" id="edit-qty-${p.id}" value="${formatQty(p.qty, p.unit)}" style="width: 85px; padding:0.4rem;" title="Current Stock">
                                        <select id="edit-unit-${p.id}" style="width: 70px; padding:0.4rem;" onchange="const root = this.closest('.product-edit-root'); root.querySelector('[id^=\'edit-size-\']').style.display = this.value === 'pcs' ? 'none' : 'inline-block'; if(this.value === 'pcs') root.querySelector('[id^=\'edit-size-\']').value = 1;">
                                            <option value="pcs" ${p.unit === 'pcs' ? 'selected' : ''}>pcs</option>
                                            <option value="kg" ${p.unit === 'kg' ? 'selected' : ''}>kg</option>
                                            <option value="g" ${p.unit === 'g' ? 'selected' : ''}>g</option>
                                        </select>
                                    </div>
                                    <input type="number" step="0.001" id="edit-size-${p.id}" value="${p.itemSize || 1}" style="width: 100%; padding:0.4rem; display: ${p.unit === 'pcs' ? 'none' : 'inline-block'};" title="Size per Bag (Weight)">
                                </div>
                            </td>
                            <td style="min-width: 280px;">
                                <div style="display:flex; flex-direction:column; gap:0.5rem;" class="product-edit-root">
                                    <div style="display:flex; align-items:center; gap:0.5rem;">
                                        <div style="flex:1;">
                                            <label style="font-size:0.65rem; color:var(--text-muted); font-weight:700;">Cost (Total)</label>
                                            <input type="number" step="0.01" id="edit-cost-${p.id}" value="${p.totalCost || 0}" style="width: 100%; padding:0.5rem; font-weight:700;" title="Total Batch Cost">
                                        </div>
                                        <span style="font-weight:bold; margin-top:1.2rem;">/</span>
                                        <div style="flex:1;">
                                            <label style="font-size:0.65rem; color:var(--text-muted); font-weight:700;">Price (Unit)</label>
                                            <input type="number" step="0.01" id="edit-sell-price-${p.id}" value="${p.sellPrice || 0}" style="width: 100%; padding:0.5rem; font-weight:700; color:var(--primary);" title="Unit Sale Price">
                                        </div>
                                    </div>
                                    <div class="promo-manager-container" style="background:rgba(13,148,136,0.05); padding:0.5rem; border-radius:0.5rem; border:1px dashed var(--primary);">
                                        <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer; font-size:0.85rem; font-weight:600; margin-bottom:0;">
                                            <input type="checkbox" id="edit-promo-toggle-${p.id}" ${p.promoEnabled ? 'checked' : ''} onchange="this.closest('.promo-manager-container').querySelector('.promo-manager-sub').style.display = this.checked ? 'block' : 'none'">
                                            العروض (Promotions)
                                        </label>
                                        <div class="promo-manager-sub" style="display:${p.promoEnabled ? 'block' : 'none'}; margin-top:0.5rem;">
                                            <div id="edit-promo-list-${p.id}" class="promo-list">
                                                ${(p.promos || []).map(pr => `
                                                    <div class="promo-item">
                                                        <div><input type="number" class="promo-qty-val" value="${pr.qty}" style="width:60px; padding:0.3rem;"></div>
                                                        <div><input type="number" class="promo-price-val" value="${pr.price}" step="0.01" style="width:80px; padding:0.3rem;"></div>
                                                        <button type="button" class="delete-btn" onclick="this.parentElement.remove()" style="padding:0.2rem; color:var(--danger);"><i data-lucide="x"></i></button>
                                                    </div>
                                                `).join('')}
                                            </div>
                                            <button type="button" class="btn-add-promo" onclick="addPromoRowToEdit(${p.id}, this)" style="padding:0.3rem 0.6rem; margin-top:0.3rem; font-size:0.75rem;">
                                                <i data-lucide="plus"></i> إضافة عرض
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td style="width: 100px;">
                                <div style="display:flex; gap:0.5rem; justify-content:flex-end;">
                                    <button class="delete-btn" style="color: var(--success); padding:0.5rem;" onclick="saveProductEdit(${p.id})"><i data-lucide="check" style="width:24px; height:24px;"></i></button>
                                    <button class="delete-btn" style="color: var(--danger); padding:0.5rem;" onclick="cancelEdit()"><i data-lucide="x" style="width:24px; height:24px;"></i></button>
                                </div>
                            </td>
                        </tr>`;
            invList.innerHTML += editRow;
            if (invCardsList) invCardsList.innerHTML += `<div class="product-card" style="border: 3px solid var(--primary); padding:1rem; border-radius:1rem; margin-bottom:0.75rem;">${editRow.replace(/<tr>|<\/tr>/g, '').replace(/<td[^>]*>/g, '<div>').replace(/<\/td>/g, '</div>')}</div>`;
            return;
        }

        // ---- RESTOCKING ROW ----
        if (restockingId === p.id) {
            const restockHtml = `
                        <tr style="background: rgba(34,197,94,0.08);">
                            <td colspan="4">
                                <div style="display:flex; align-items:flex-start; gap:0.75rem; flex-wrap:wrap; padding: 0.5rem 0;">
                                    <strong style="color:var(--success); align-self:center;">${p.name}</strong>
                                    <div style="display:flex; flex-direction:column; gap:0.3rem;">
                                        <label style="font-size:0.75rem; color:var(--text-muted); margin:0;">🧮 عدد الوحدات الجديدة</label>
                                        <input type="number" id="restock-bags-${p.id}" min="0.001" step="0.001" placeholder="14" style="width:90px;" oninput="updateRestockPreview(${p.id})">
                                        <div id="restock-preview-${p.id}" style="font-size:0.75rem; font-weight:bold; color:var(--primary);"></div>
                                    </div>
                                    <div style="display:flex; flex-direction:column; gap:0.3rem;">
                                        <label style="font-size:0.75rem; color:var(--text-muted); margin:0;">💰 تكلفة الدفعة (DA)</label>
                                        <input type="number" id="restock-cost-${p.id}" min="0" step="1" placeholder="5000" style="width:100px;">
                                    </div>
                                    <div style="display:flex; flex-direction:column; gap:0.3rem;">
                                        <label style="font-size:0.75rem; color:var(--text-muted); margin:0;">🏷️ سعر البيع/وحدة (DA)</label>
                                        <input type="number" id="restock-sell-${p.id}" min="0" step="1" placeholder="${p.sellPrice || 120}" value="${p.sellPrice || 0}" style="width:100px; border-color:var(--primary);">
                                    </div>
                                    <div style="display:flex; flex-direction:column; gap:0.3rem;">
                                        <label style="font-size:0.75rem; color:var(--text-muted); margin:0;">🎁 Promo: كمية</label>
                                        <input type="number" id="restock-promo-qty-${p.id}" min="0" step="1" placeholder="2" style="width:70px;" value="${(p.promoEnabled && p.promos && p.promos[0]) ? Math.round(p.promos[0].qty) : ''}">
                                    </div>
                                    <div style="display:flex; flex-direction:column; gap:0.3rem;">
                                        <label style="font-size:0.75rem; color:var(--text-muted); margin:0;">🎁 Promo: سعر المجموعة</label>
                                        <input type="number" id="restock-promo-price-${p.id}" min="0" step="1" placeholder="200" style="width:80px;" value="${(p.promoEnabled && p.promos && p.promos[0]) ? Math.round(p.promos[0].price) : ''}">
                                    </div>
                                    <div style="align-self:flex-end; display:flex; gap:0.4rem;">
                                        <button class="delete-btn" style="color:var(--success);" onclick="saveRestock(${p.id})"><i data-lucide="check"></i></button>
                                        <button class="delete-btn" onclick="cancelRestock()"><i data-lucide="x"></i></button>
                                    </div>
                                </div>
                            </td>
                        </tr>`;
            invList.innerHTML += restockHtml;
            // Mobile card version
            if (invCardsList) {
                invCardsList.innerHTML += `
                            <div class="restock-card" style="border: 2px solid var(--success); padding: 1rem; border-radius: 1rem; margin-bottom: 0.75rem; background: rgba(34,197,94,0.05);">
                                <strong style="color:var(--success);">${p.name}</strong>
                                <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.5rem;">Current Stock: <span style="font-weight:bold;">${formatQty(p.qty, p.unit)}</span></div>
                                <div class="restock-row">
                                    <label style="font-size:0.8rem;">🧮 عدد الوحدات الجديدة</label>
                                    <input type="number" id="restock-bags-${p.id}-m" min="0.001" step="0.001" placeholder="14" style="width:90px;" oninput="updateRestockPreview(${p.id}, 'm')">
                                </div>
                                <div id="restock-preview-${p.id}-m" style="font-size:0.8rem; font-weight:bold; color:var(--primary); margin:0.3rem 0;"></div>
                                <div class="restock-row">
                                    <label style="font-size:0.8rem;">💰 تكلفة الدفعة (DA)</label>
                                    <input type="number" id="restock-cost-${p.id}-m" min="0" step="1" placeholder="5000" style="width:110px;">
                                </div>
                                <div class="restock-row">
                                    <label style="font-size:0.8rem;">🏷️ سعر البيع/وحدة (DA)</label>
                                    <input type="number" id="restock-sell-${p.id}-m" min="0" step="1" placeholder="${p.sellPrice || 120}" value="${p.sellPrice || 0}" style="width:110px; border-color:var(--primary);">
                                </div>
                                <div class="restock-row">
                                    <label style="font-size:0.8rem;">🎁 Promo كمية × سعر المجموعة</label>
                                    <div style="display:flex; gap:0.4rem;">
                                        <input type="number" id="restock-promo-qty-${p.id}-m" min="0" step="1" placeholder="2" style="width:70px;" value="${(p.promoEnabled && p.promos && p.promos[0]) ? Math.round(p.promos[0].qty) : ''}">
                                        <input type="number" id="restock-promo-price-${p.id}-m" min="0" step="1" placeholder="200" style="width:80px;" value="${(p.promoEnabled && p.promos && p.promos[0]) ? Math.round(p.promos[0].price) : ''}">
                                    </div>
                                </div>
                                <div class="restock-row">
                                    <button class="delete-btn" style="color:var(--success); padding:0.5rem 1rem;" onclick="saveMobileRestock(${p.id})"><i data-lucide="check"></i> Save</button>
                                    <button class="delete-btn" style="padding:0.5rem 1rem;" onclick="cancelRestock()"><i data-lucide="x"></i> Cancel</button>
                                </div>
                            </div>`;
            }
            return;
        }

        // ---- NORMAL ROW ----
        const imgHtml = p.image
            ? `<img src="${p.image}" class="product-img-thumb" onclick="openCameraForProduct(${p.id})">`
            : `<div class="product-img-thumb empty" onclick="openCameraForProduct(${p.id})"><i data-lucide="camera" style="width:18px; color:var(--text-muted);"></i></div>`;

        // Fix barcode display to avoid "undefined"
        const displayBarcode = p.barcodes && p.barcodes.length > 0
            ? p.barcodes[0]
            : (p.barcode || '---');

        invList.innerHTML += `
                    <tr>
                        <td style="width: 60px;">${imgHtml}</td>
                        <td style="min-width: 200px;">
                            <strong style="display:block; font-size:1.1rem; color:var(--text-main);">${p.name}</strong>
                            <span style="font-size:0.75rem; color:var(--text-muted); font-family:monospace;">${displayBarcode}</span>
                        </td>
                        <td>
                            <span class="badge ${isLow ? 'badge-low' : 'badge-ok'}" dir="ltr" style="font-size:1rem; padding:0.25rem 1.5rem; display:inline-block; white-space:nowrap; border: 1px solid rgba(0,0,0,0.1); min-width: 130px; text-align: center; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                                ${bagsLeft} units (${formatQty(p.qty, p.unit)})
                            </span>
                        </td>
                        <td style="font-weight:600; font-size:1rem;">
                            <span dir="ltr" class="privacy-value">${(p.totalCost || 0).toLocaleString()} / ${(p.sellPrice || 0).toLocaleString()} DA</span>
                        </td>
                        <td>
                            <div style="display: flex; gap: 0.75rem; align-items: center; justify-content: flex-end;">
                                <button class="delete-btn" style="color: #059669;" title="Restock" onclick="restockProduct(${p.id})"><i data-lucide="plus-circle" style="width:22px; height:22px;"></i></button>
                                <button class="delete-btn" style="color: #2563eb;" title="Edit" onclick="editProduct(${p.id})"><i data-lucide="pencil" style="width:22px; height:22px;"></i></button>
                                <button class="delete-btn" style="color: #dc2626;" title="Delete" onclick="deleteProduct(${p.id})"><i data-lucide="trash-2" style="width:22px; height:22px;"></i></button>
                            </div>
                        </td>
                    </tr>`;

        // Mobile card
        if (invCardsList) {
            invCardsList.innerHTML += `
                        <div class="product-card" style="border: 5px solid #10b981; padding: 1.25rem; border-radius: 1.25rem; margin-bottom: 1rem; box-shadow: 0 10px 20px rgba(16,185,129,0.15); background: var(--card-bg);">
                            <div style="display:flex; align-items:center; gap:1rem; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.75rem; margin-bottom: 0.75rem;">
                                <div style="width:50px; height:50px; flex-shrink:0;">${imgHtml}</div>
                                <div style="flex:1; min-width:0;">
                                    <strong style="display:block; font-size:1.05rem; line-height:1.2; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${p.name}</strong>
                                    <span style="font-size:0.75rem; color:var(--text-muted); font-family:monospace;">${p.barcode || '#' + p.id}</span>
                                </div>
                                <div style="display:flex; gap:0.4rem; align-items:center;">
                                    <button class="delete-btn" style="color: #059669; padding:0.4rem;" onclick="restockProduct(${p.id})"><i data-lucide="plus-circle" style="width:20px; height:20px;"></i></button>
                                    <button class="delete-btn" style="color: #2563eb; padding:0.4rem;" onclick="editProduct(${p.id})"><i data-lucide="pencil" style="width:20px; height:20px;"></i></button>
                                    <button class="delete-btn" style="color: #dc2626; padding:0.4rem;" onclick="deleteProduct(${p.id})"><i data-lucide="trash-2" style="width:20px; height:20px;"></i></button>
                                </div>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span class="badge ${isLow ? 'badge-low' : 'badge-ok'}" style="font-size:0.9rem; padding:0.2rem 1.2rem; white-space:nowrap; border: 1px solid rgba(0,0,0,0.1); display: inline-block; text-align: center; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">${formatQty(p.qty, p.unit)} (${bagsLeft} units)</span>
                                <span class="privacy-value" style="font-weight:800; font-size:1.1rem; color:var(--text-main);">${(p.sellPrice || 0).toLocaleString()} DA</span>
                            </div>
                        </div>`;
        }
    });

    // 3. Low Stock Table
    const lowStockList = document.getElementById('low-stock-table').querySelector('tbody');
    lowStockList.innerHTML = state.products
        .filter(p => p.unit === 'g' ? p.qty < 500 : (p.unit === 'kg' ? p.qty < 0.5 : p.qty < 5))
        .map(p => `<tr><td>${p.name}</td><td>${formatQty(p.qty, p.unit)}</td></tr>`)
        .join('') || `<tr><td colspan="2">${lang === 'ar' ? 'جميع المنتجات متوفرة بكمية كافية' : 'All items well stocked'}</td></tr>`;

    // 4. Sales Select & List
    const sSelect = document.getElementById('s-product');
    const sSearchInput = document.getElementById('s-product-filter');
    const savedValue = sSelect.value;

    // [BUG-15 FIXED] Removed search filter clear — it was wiping the user's mid-search query on every save/render.
    // The dropdown rebuild below already reads the current sSearchInput value correctly without needing a reset.

    // Sort products by name alphabetically
    const sortedProducts = [...state.products].sort((a, b) => a.name.localeCompare(b.name));

    sSelect.innerHTML = `<option value="">${translations[lang]?.sel_product || 'Select Product...'}</option>` +
        sortedProducts.map(p => `<option value="${p.id}">${p.name} (Stock: ${Math.round(p.qty)} ${p.unit})</option>`).join('') +
        `<option value="custom">✍️ ${translations[lang]?.opt_custom_item || 'Custom Item / Outside Inventory'}</option>`;
    sSelect.value = savedValue;

    const salesList = document.getElementById('sales-list');
    salesList.innerHTML = state.sales.slice(-10).reverse().map(s => `
                <tr>
                    <td>${s.date}</td>
                    <td>${s.productName}</td>
                    <td><span dir="ltr">${formatQty(s.qty, s.unit)}</span></td>
                    <td><span dir="ltr" class="privacy-value">${s.total.toLocaleString()} DA</span></td>
                    <td style="display: flex; gap: 0.4rem;">
                        <button class="delete-btn" style="color: var(--secondary);" onclick="returnSale(${s.id})" title="Return/Edit"><i data-lucide="pencil"></i></button>
                        <button class="delete-btn" onclick="deleteSale(${s.id})"><i data-lucide="trash-2"></i></button>
                    </td>
                </tr>
            `).join('');

    // 5. Expenses List
    const expList = document.getElementById('expenses-list');
    expList.innerHTML = state.expenses.slice(-10).reverse().map(e => `
                <tr>
                    <td>${e.date}</td>
                    <td>${e.desc}</td>
                    <td><span dir="ltr">${e.amount} DA</span></td>
                    <td><button class="delete-btn" onclick="deleteExpense(${e.id})"><i data-lucide="trash-2"></i></button></td>
                </tr>
            `).join('');

    // 6. Trash Lists
    const trashProdList = document.getElementById('trash-products-list');
    trashProdList.innerHTML = state.trash.products.map(p => `
                <tr>
                    <td>${p.name}</td>
                    <td>
                        <button class="delete-btn" style="color: var(--success);" onclick="restoreItem('products', ${p.id})"><i data-lucide="rotate-ccw"></i></button>
                        <button class="delete-btn" onclick="permanentDelete('products', ${p.id})"><i data-lucide="x-circle"></i></button>
                    </td>
                </tr>
            `).join('');

    const trashOtherList = document.getElementById('trash-others-list');
    const otherItems = [
        ...state.trash.sales.map(s => ({ ...s, type: 'Sale', desc: s.productName, amt: s.total })),
        ...state.trash.expenses.map(e => ({ ...e, type: 'Expense', desc: e.desc, amt: e.amount })),
        ...state.trash.credits.map(c => ({ ...c, type: 'Credit', desc: c.customerName + ' - ' + c.productName, amt: c.total }))
    ];
    trashOtherList.innerHTML = otherItems.map(item => `
                <tr>
                    <td><span class="badge" style="background: var(--secondary-light); color: var(--secondary);">${item.type}</span></td>
                    <td>${item.desc}</td>
                    <td><span dir="ltr">${item.amt} DA</span></td>
                    <td>
                        <button class="delete-btn" style="color: var(--success);" onclick="restoreItem('${item.type.toLowerCase()}s', ${item.id})"><i data-lucide="rotate-ccw"></i></button>
                        <button class="delete-btn" onclick="permanentDelete('${item.type.toLowerCase()}s', ${item.id})"><i data-lucide="x-circle"></i></button>
                    </td>
                </tr>
            `).join('');

    renderCredits();
    updateAnalytics();
    updateChart();
    updateFinancialReports(getUnitCost);

    // Final call to ensure all icons (edit, camera, etc.) appear
    lucide.createIcons();
}

function updateFinancialReports(getUnitCost) {
    const dailyMap = {};
    const monthlyMap = {};
    const yearlyMap = {};

    // Group Sales
    state.sales.forEach(s => {
        const d = parseDateSafety(s.date); // [BUG-8 FIXED] new Date(locale-string) returns Invalid Date on non-US locales
        if (isNaN(d.getTime())) return; // [BUG-8 FIXED] isNaN(Date) is unreliable — use .getTime()

        const dayKey = s.date;
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const yearKey = `${d.getFullYear()}`;

        // [BUG-7 FIXED] Was using current WAC (getUnitCost) for ALL historical sales.
        // For FIFO products, s.cost holds the exact cost recorded at time of sale — use it.
        const margin = (s.cost !== undefined) ? s.total - s.cost : s.total - (s.qty * getUnitCost(s));

        if (!dailyMap[dayKey]) dailyMap[dayKey] = { rev: 0, profit: 0 };
        dailyMap[dayKey].rev += s.total;
        dailyMap[dayKey].profit += margin;

        if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { rev: 0, profit: 0 };
        monthlyMap[monthKey].rev += s.total;
        monthlyMap[monthKey].profit += margin;

        if (!yearlyMap[yearKey]) yearlyMap[yearKey] = { rev: 0, profit: 0 };
        yearlyMap[yearKey].rev += s.total;
        yearlyMap[yearKey].profit += margin;
    });

    // Subtract Expenses
    state.expenses.forEach(e => {
        const d = parseDateSafety(e.date); // [BUG-8 FIXED] Locale-safe date parsing
        if (isNaN(d.getTime())) return; // [BUG-8 FIXED]

        const dayKey = e.date;
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const yearKey = `${d.getFullYear()}`;

        if (!dailyMap[dayKey]) dailyMap[dayKey] = { rev: 0, profit: 0 };
        dailyMap[dayKey].profit -= e.amount;

        if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { rev: 0, profit: 0 };
        monthlyMap[monthKey].profit -= e.amount;

        if (!yearlyMap[yearKey]) yearlyMap[yearKey] = { rev: 0, profit: 0 };
        yearlyMap[yearKey].profit -= e.amount;
    });

    const renderTable = (mapObj, elementId) => {
        const sortedKeys = Object.keys(mapObj).sort((a, b) => new Date(b) - new Date(a));
        document.getElementById(elementId).innerHTML = sortedKeys.map(k => {
            const data = mapObj[k];
            return `<tr>
                        <td style="font-weight: 600;">${k}</td>
                        <td><span dir="ltr" class="privacy-value">${data.rev.toLocaleString()} DA</span></td>
                        <td style="color: ${data.profit >= 0 ? 'var(--primary)' : 'var(--danger)'}; font-weight: 700;">
                            <span dir="ltr" class="privacy-value">${data.profit >= 0 ? '+' : ''}${data.profit.toLocaleString()} DA</span>
                        </td>
                    </tr>`;
        }).join('') || `<tr><td colspan="3" style="text-align: center;">No data available</td></tr>`;
    };

    renderTable(dailyMap, 'daily-report-list');
    renderTable(monthlyMap, 'monthly-report-list');
    renderTable(yearlyMap, 'yearly-report-list');
}

function updateAnalytics() {
    const list = document.getElementById('analytics-list');

    // Map products for easier access
    const productMap = {};
    state.products.forEach(p => { productMap[p.id] = p; });

    // Aggregate data by product NAME (since the user might add same product multiple times)
    const aggregates = {};

    state.products.concat(state.trash.products).forEach(p => {
        if (!aggregates[p.name]) {
            aggregates[p.name] = { stock: 0, sold: 0, revenue: 0, totalInvestment: 0, totalInitialQty: 0, costOfSales: 0 };
        }
    });

    // [PERF-1 FIXED] Pre-build a qty-sold lookup map to avoid O(n*m) nested filter+reduce.
    // Before: 50 products × 1000 sales = 50,000 iterations on every render.
    // After: one linear pass to build the map, then O(1) lookups per product.
    const allSalesForAnalytics = state.sales.concat(state.trash.sales);
    const soldQtyByProductId = {};
    allSalesForAnalytics.forEach(s => {
        soldQtyByProductId[s.productId] = (soldQtyByProductId[s.productId] || 0) + s.qty;
    });

    state.products.concat(state.trash.products).forEach(p => {
        const salesForThisProd = soldQtyByProductId[p.id] || 0;
        const actualInitialQty = p.initialQty || (p.qty + salesForThisProd);

        aggregates[p.name].stock += p.qty;
        aggregates[p.name].totalInvestment += (p.totalCost || 0);
        aggregates[p.name].totalInitialQty += actualInitialQty;
    });

    state.sales.forEach(s => {
        if (aggregates[s.productName]) {
            aggregates[s.productName].sold += s.qty;
            aggregates[s.productName].revenue += s.total;
            
            // Use recorded cost if available, else fallback to current average
            if (s.cost !== undefined) {
                aggregates[s.productName].costOfSales += s.cost;
            } else {
                const unitCost = aggregates[s.productName].totalInitialQty > 0 ? (aggregates[s.productName].totalInvestment / aggregates[s.productName].totalInitialQty) : 0;
                aggregates[s.productName].costOfSales += AppFinance.round(s.qty * unitCost);
            }
        }
    });

    list.innerHTML = Object.keys(aggregates).map(name => {
        const data = aggregates[name];
        const profit = AppFinance.round(data.revenue - data.costOfSales);
        const prod = state.products.find(p => p.name === name);
        const unit = prod?.unit || 'pcs';

        let stockDisplay = Math.round(data.stock);
        let soldDisplay = Math.round(data.sold);

        if (unit === 'kg') {
            stockDisplay += " kg";
            soldDisplay += " kg";
        } else {
            stockDisplay += ` ${unit}`;
            soldDisplay += ` ${unit}`;
        }

        return `
                    <tr>
                        <td style="font-weight: 600;">${name}</td>
                        <td>${stockDisplay}</td>
                        <td>${soldDisplay}</td>
                        <td><span dir="ltr" class="privacy-value">${AppFinance.round(data.totalInvestment).toLocaleString()} DA</span></td>
                        <td><span dir="ltr" class="privacy-value">${AppFinance.round(prod?.sellPrice || 0).toLocaleString()} DA</span></td>
                        <td><span dir="ltr" class="privacy-value">${AppFinance.round(data.revenue).toLocaleString()} DA</span></td>
                        <td style="color: ${profit >= 0 ? 'var(--primary)' : 'var(--danger)'}; font-weight: 700;">
                            <span dir="ltr" class="privacy-value">${profit >= 0 ? '+' : ''}${profit.toLocaleString()} DA</span>
                        </td>
                    </tr>
                `;
    }).join('') || '<tr><td colspan="7" style="text-align: center;">No data available yet</td></tr>';
}

function updateChart() {
    const ctx = document.getElementById('profitChart').getContext('2d');

    // Prep data from last 7 entries for demo or group by date
    // For this app, we group simple 7 days data
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push(d.toLocaleDateString());
    }

    const dailyProfit = last7Days.map(date => {
        const revenue = state.sales.filter(s => s.date === date).reduce((sum, s) => sum + s.total, 0);
        const expense = state.expenses.filter(e => e.date === date).reduce((sum, e) => sum + e.amount, 0);
        return revenue - expense;
    });

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid').trim();
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-text').trim();

    // [BUG-12 FIXED] Update chart data in-place instead of destroy()+recreate on every renderAll().
    // destroy() caused visible canvas flicker and wasted GPU resources on every save/edit.
    if (myChart) {
        myChart.data.labels = last7Days.map(d => d.split('/')[0] + '/' + d.split('/')[1]);
        myChart.data.datasets[0].data = dailyProfit;
        myChart.data.datasets[0].backgroundColor = isDark ? 'rgba(13, 148, 136, 0.3)' : 'rgba(13, 148, 136, 0.1)';
        myChart.options.scales.y.grid.color = gridColor;
        myChart.options.scales.y.ticks.color = textColor;
        myChart.options.scales.x.ticks.color = textColor;
        myChart.update('none'); // 'none' = skip animation for instant silent update
        return;
    }
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days.map(d => d.split('/')[0] + '/' + d.split('/')[1]),
            datasets: [{
                label: 'Profit (DA)',
                data: dailyProfit,
                borderColor: '#0d9488',
                backgroundColor: isDark ? 'rgba(13, 148, 136, 0.3)' : 'rgba(13, 148, 136, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: textColor }
                }
            }
        }
    });
}

// ============================================================
// ===== PRIVACY MODE ENGINE =====
// ============================================================
const PRIVACY_KEY = 'animal_land_privacy_pin_hash';
const PRIVACY_CRED = 'animal_land_biometric_cred';
let privacyMode = 'unlock'; // 'unlock' | 'setup' | 'setup-confirm'
let privacyPinTemp = null;
let privacyLocked = true;
let pmCurrentPin = ''; // PIN being typed via numpad
let pmMaxLen = 6;      // Max dots shown

// --- Simple hash (SHA-256 via SubtleCrypto) ---
async function hashPIN(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + 'animal_land_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hasPIN() { return !!localStorage.getItem(PRIVACY_KEY); }
function hasBiometricCred() { return !!localStorage.getItem(PRIVACY_CRED); }

// --- PIN Dot Rendering ---
function pmUpdateDots(errorState = false) {
    const dotsEl = document.getElementById('pm-dots');
    dotsEl.innerHTML = '';
    for (let i = 0; i < pmMaxLen; i++) {
        const dot = document.createElement('div');
        dot.className = 'pm-dot';
        if (i < pmCurrentPin.length) {
            dot.classList.add(errorState ? 'error-dot' : 'filled');
        }
        dotsEl.appendChild(dot);
    }
}

// --- Numpad Key Press ---
function pmKey(digit) {
    if (pmCurrentPin.length >= 8) return;
    pmCurrentPin += digit;
    pmMaxLen = Math.max(pmMaxLen, Math.min(pmCurrentPin.length + 1, 8));
    pmUpdateDots();
    document.getElementById('privacy-pin-input').value = pmCurrentPin;
    document.getElementById('privacy-error').textContent = '';
}

function pmDel() {
    if (pmCurrentPin.length === 0) return;
    pmCurrentPin = pmCurrentPin.slice(0, -1);
    pmUpdateDots();
    document.getElementById('privacy-pin-input').value = pmCurrentPin;
}

// --- Lock/Unlock UI ---
function setPrivacyLocked(locked) {
    privacyLocked = locked;
    document.body.classList.toggle('privacy-locked', locked);
    const icon = document.getElementById('privacy-icon');
    icon.setAttribute('data-lucide', locked ? 'eye-off' : 'eye');
    lucide.createIcons();
}

// --- Handle lock button click ---
function handlePrivacyToggle() {
    if (!privacyLocked) {
        setPrivacyLocked(true);
        return;
    }
    openPrivacyModal();
}

function openPrivacyModal() {
    const modal = document.getElementById('privacy-modal');
    const biometricBtn = document.getElementById('privacy-biometric-btn');
    const resetLink = document.getElementById('privacy-reset-link');

    // Reset state
    pmCurrentPin = '';
    pmMaxLen = 6;
    document.getElementById('privacy-pin-input').value = '';
    document.getElementById('privacy-error').textContent = '';
    document.getElementById('pm-lock-ring').className = 'pm-lock-ring';
    pmUpdateDots();

    if (!hasPIN()) {
        privacyMode = 'setup';
        pmMaxLen = 6;
        pmUpdateDots();
        document.getElementById('pm-lock-ring').textContent = '🛡️';
        document.getElementById('privacy-modal-title').textContent = 'Create Your PIN';
        document.getElementById('privacy-modal-sub').textContent = 'Choose 4–8 digits to protect your data';
        biometricBtn.classList.remove('show');
        resetLink.style.display = 'none';
    } else {
        privacyMode = 'unlock';
        document.getElementById('pm-lock-ring').textContent = '🔐';
        document.getElementById('privacy-modal-title').textContent = 'Unlock Financial Data';
        document.getElementById('privacy-modal-sub').textContent = 'Enter your PIN to continue';
        resetLink.style.display = 'block';

        if (hasBiometricCred() && window.PublicKeyCredential) {
            biometricBtn.classList.add('show');
        } else {
            biometricBtn.classList.remove('show');
        }
    }

    modal.classList.add('open');
}

function closePrivacyModal() {
    document.getElementById('privacy-modal').classList.remove('open');
    pmCurrentPin = '';
    pmMaxLen = 6;
    pmUpdateDots();
    document.getElementById('privacy-pin-input').value = '';
    document.getElementById('privacy-error').textContent = '';
    privacyMode = 'unlock';
    privacyPinTemp = null;
}

function pmShowError(msg) {
    document.getElementById('privacy-error').textContent = msg;
    const ring = document.getElementById('pm-lock-ring');
    ring.classList.add('error');
    pmUpdateDots(true);
    setTimeout(() => {
        ring.classList.remove('error');
        pmCurrentPin = '';
        pmMaxLen = 6;
        pmUpdateDots();
        document.getElementById('privacy-pin-input').value = '';
    }, 600);
}

async function privacySubmit() {
    const pin = pmCurrentPin;
    if (pin.length < 4) {
        pmShowError('At least 4 digits required');
        return;
    }

    if (privacyMode === 'setup') {
        privacyPinTemp = pin;
        privacyMode = 'setup-confirm';
        document.getElementById('privacy-modal-title').textContent = 'Confirm Your PIN';
        document.getElementById('privacy-modal-sub').textContent = 'Re-enter the same PIN';
        pmCurrentPin = '';
        pmUpdateDots();
        document.getElementById('privacy-pin-input').value = '';
        document.getElementById('privacy-error').textContent = '';
        return;
    }

    if (privacyMode === 'setup-confirm') {
        if (pin !== privacyPinTemp) {
            privacyPinTemp = null;
            privacyMode = 'setup';
            document.getElementById('privacy-modal-title').textContent = 'Create Your PIN';
            document.getElementById('privacy-modal-sub').textContent = 'PINs did not match — try again';
            pmShowError('❌ PINs do not match');
            return;
        }
        const hashed = await hashPIN(pin);
        localStorage.setItem(PRIVACY_KEY, hashed);

        // Generate & store recovery code
        const recoveryCode = generateRecoveryCode();
        const recoveryHashed = await hashPIN(recoveryCode);
        localStorage.setItem('animal_land_recovery_hash', recoveryHashed);

        closePrivacyModal();
        setPrivacyLocked(false);
        privacyPinTemp = null;

        // Show recovery code to user
        setTimeout(() => showRecoveryCode(recoveryCode), 300);
        return;
    }

    // Unlock mode
    const hashed = await hashPIN(pin);
    const stored = localStorage.getItem(PRIVACY_KEY);
    if (hashed === stored) {
        closePrivacyModal();
        setPrivacyLocked(false);
    } else {
        pmShowError('❌ Incorrect PIN');
    }
}

// --- Biometric (WebAuthn) ---
async function offerBiometricEnrollment() {
    const want = confirm('🪪 Enable Face ID / Fingerprint unlock?');
    if (!want) return;
    try {
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);
        const credential = await navigator.credentials.create({
            publicKey: {
                challenge,
                rp: { name: 'Animal Land Pro' },
                user: { id: new TextEncoder().encode('animal-land-user'), name: 'owner', displayName: 'Shop Owner' },
                pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
                authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
                timeout: 60000
            }
        });
        const credId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        localStorage.setItem(PRIVACY_CRED, credId);
        alert('✅ Face ID / Fingerprint enabled!');
    } catch (err) {
        console.warn('Biometric enrollment failed:', err);
    }
}

async function privacyBiometricUnlock() {
    const credIdB64 = localStorage.getItem(PRIVACY_CRED);
    if (!credIdB64) return;
    try {
        const credId = Uint8Array.from(atob(credIdB64), c => c.charCodeAt(0));
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);
        await navigator.credentials.get({
            publicKey: {
                challenge,
                allowCredentials: [{ id: credId, type: 'public-key' }],
                userVerification: 'required',
                timeout: 60000
            }
        });
        closePrivacyModal();
        setPrivacyLocked(false);
    } catch (err) {
        pmShowError('❌ Biometric failed. Use PIN.');
        console.warn('Biometric unlock error:', err);
    }
}

// --- Recovery Code System ---
function generateRecoveryCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
    const seg = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${seg(4)}-${seg(4)}-${seg(4)}`;
}

function showRecoveryCode(code) {
    const overlay = document.getElementById('recovery-overlay');
    const box = document.getElementById('recovery-box-content');
    box.innerHTML = `
                <div class="recovery-icon">🔑</div>
                <div class="recovery-title">Your Recovery Code</div>
                <div class="recovery-sub">Save this code somewhere safe.<br>It's the <strong style="color:#fbbf24">only way</strong> to recover access if you forget your PIN.</div>
                <div class="recovery-code-display" id="rc-code-display">${code}</div>
                <div class="recovery-warning">⚠️ This code will NOT be shown again</div>
                <button class="recovery-btn" onclick="copyRecoveryCode('${code}')">📋 Copy Code</button>
                <button class="recovery-btn-sec" onclick="closeRecoveryOverlay(true)">
                    ✅ I saved it — Continue
                </button>
            `;
    overlay.classList.add('open');
}

async function copyRecoveryCode(code) {
    try {
        await navigator.clipboard.writeText(code);
        const btn = document.querySelector('.recovery-btn');
        btn.textContent = '✅ Copied!';
        btn.style.background = 'linear-gradient(135deg, #16a34a, #15803d)';
        setTimeout(() => {
            btn.textContent = '📋 Copy Code';
            btn.style.background = '';
        }, 2000);
    } catch (e) {
        // Fallback: select text
        const el = document.getElementById('rc-code-display');
        const range = document.createRange();
        range.selectNode(el);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
    }
}

function closeRecoveryOverlay(offerBiometric = false) {
    document.getElementById('recovery-overlay').classList.remove('open');
    if (offerBiometric && window.PublicKeyCredential) {
        setTimeout(() => offerBiometricEnrollment(), 300);
    }
}

function privacyResetPIN() {
    // Open recovery input screen
    closePrivacyModal();
    const overlay = document.getElementById('recovery-overlay');
    const box = document.getElementById('recovery-box-content');
    box.innerHTML = `
                <div class="recovery-icon">🔐</div>
                <div class="recovery-title">Enter Recovery Code</div>
                <div class="recovery-sub">Enter the 12-character recovery code<br>you saved when creating your PIN.</div>
                <input class="recovery-input" id="recovery-code-input" maxlength="14"
                    placeholder="XXXX-XXXX-XXXX" autocomplete="off" autocapitalize="characters"
                    oninput="this.value = this.value.toUpperCase().replace(/[^A-Z0-9-]/g,'')">
                <div class="recovery-error" id="recovery-error-msg"></div>
                <button class="recovery-btn" onclick="submitRecoveryCode()">🔓 Reset PIN</button>
                <button class="recovery-btn-sec" onclick="closeRecoveryOverlay()">Cancel</button>
            `;
    overlay.classList.add('open');
    setTimeout(() => document.getElementById('recovery-code-input')?.focus(), 300);
}

async function submitRecoveryCode() {
    const inputEl = document.getElementById('recovery-code-input');
    const errEl = document.getElementById('recovery-error-msg');
    const code = inputEl.value.trim().toUpperCase();

    if (code.length < 14) {
        errEl.textContent = '❌ Enter the full code (XXXX-XXXX-XXXX)';
        return;
    }

    const storedHash = localStorage.getItem('animal_land_recovery_hash');
    if (!storedHash) {
        errEl.textContent = '❌ No recovery code found.';
        return;
    }

    const inputHash = await hashPIN(code);
    if (inputHash !== storedHash) {
        errEl.textContent = '❌ Incorrect recovery code.';
        inputEl.style.borderColor = 'rgba(239,68,68,0.6)';
        setTimeout(() => { inputEl.style.borderColor = ''; }, 1500);
        return;
    }

    // Clear PIN and credentials
    localStorage.removeItem(PRIVACY_KEY);
    localStorage.removeItem(PRIVACY_CRED);
    localStorage.removeItem('animal_land_recovery_hash');
    closeRecoveryOverlay();
    setPrivacyLocked(false);

    // Let user set new PIN
    setTimeout(() => {
        openPrivacyModal();
    }, 400);
}

// Keyboard support
document.getElementById('privacy-pin-input').addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9') pmKey(e.key);
    else if (e.key === 'Backspace') pmDel();
    else if (e.key === 'Enter') privacySubmit();
});

// Allow Enter on recovery input
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.getElementById('recovery-code-input') === document.activeElement) {
        submitRecoveryCode();
    }
});

// Close modal on overlay click
document.getElementById('privacy-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('privacy-modal')) closePrivacyModal();
});
document.getElementById('recovery-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('recovery-overlay')) closeRecoveryOverlay();
});

// --- Init Privacy State ---
function initPrivacy() {
    if (hasPIN()) {
        // Has PIN → start locked
        setPrivacyLocked(true);
    } else {
        // No PIN yet → unlocked but icon is eye-off to invite setup
        setPrivacyLocked(false);
    }
}
// ============================================================

// --- Professional Barcode Management (Modal-based) ---
let currentModalBarcodes = [];

function openBarcodeModal() {
    const modal = document.getElementById('barcode-manager-modal');
    const list = document.getElementById('modal-barcode-list');
    list.innerHTML = '';

    // Populate with existing temp values if any
    if (currentModalBarcodes.length === 0) {
        addModalBarcodeRow();
    } else {
        currentModalBarcodes.forEach(b => addModalBarcodeRow(b));
    }

    modal.style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeBarcodeModal() {
    document.getElementById('barcode-manager-modal').style.display = 'none';
}

function addModalBarcodeRow(val = '') {
    const list = document.getElementById('modal-barcode-list');

    // Prevent adding an empty row if the last one is already empty
    const existingInputs = list.querySelectorAll('.m-barcode-input');
    if (existingInputs.length > 0) {
        const lastInput = existingInputs[existingInputs.length - 1];
        if (lastInput.value.trim() === '' && val === '') {
            lastInput.focus();
            return; // Already have an empty box at the end
        }
    }

    const row = document.createElement('div');
    row.className = 'barcode-list-item animated-fade-in';
    row.innerHTML = `
                <i data-lucide="hash" style="width:18px; color:var(--text-muted);"></i>
                <input type="text" class="m-barcode-input" placeholder="Scan/Enter barcode..." value="${val}" autocomplete="off">
                <button type="button" class="delete-btn" onclick="this.parentElement.remove()" style="padding:0.4rem; color:var(--danger);">
                    <i data-lucide="trash-2"></i>
                </button>
            `;
    list.appendChild(row);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const input = row.querySelector('input');
    input.focus();

    // Auto-jump logic
    input.addEventListener('input', (e) => {
        // Prevent multiple triggers for the same input field
        if (e.target.value.length >= 8 && !row.dataset.triggered) {
            const inputs = list.querySelectorAll('.m-barcode-input');
            if (e.target === inputs[inputs.length - 1]) {
                row.dataset.triggered = 'true'; // Mark this row as processed
                setTimeout(() => addModalBarcodeRow(), 150);
            }
        }
    });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addModalBarcodeRow();
        }
    });
}

function confirmBarcodeModal() {
    const inputs = document.querySelectorAll('.m-barcode-input');
    currentModalBarcodes = Array.from(inputs)
        .map(i => i.value.trim())
        .filter(v => v !== '');

    updateBarcodeBadge();
    closeBarcodeModal();
}

function updateBarcodeBadge() {
    const badge = document.getElementById('barcode-badge-summary');
    const text = document.getElementById('barcode-count-text');
    if (currentModalBarcodes.length > 0) {
        badge.style.display = 'flex';
        badge.style.alignItems = 'center';
        badge.style.gap = '0.3rem';
        text.textContent = `${currentModalBarcodes.length} extra barcode(s) added`;
    } else {
        badge.style.display = 'none';
    }
}

// --- POS & Barcode System ---
let posCart = JSON.parse(localStorage.getItem('animal_land_pos_cart')) || [];
function persistCart() { localStorage.setItem('animal_land_pos_cart', JSON.stringify(posCart)); }
let html5QrCode = null;

function posBeep(isSuccess = true) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (!audioCtx) return;
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = isSuccess ? 'sine' : 'sawtooth';
        oscillator.frequency.setValueAtTime(isSuccess ? 1200 : 300, audioCtx.currentTime);
        if (isSuccess) oscillator.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (isSuccess ? 0.3 : 0.5));

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + (isSuccess ? 0.3 : 0.5));
    } catch (e) { console.error("Audio API error:", e); }
}

async function startCameraScanner() {
    if (!document.getElementById('pos-view').classList.contains('active')) return;
    document.getElementById('qr-reader-container').style.display = 'block';
    document.getElementById('btn-start-scanner').style.display = 'none';
    document.getElementById('btn-stop-scanner').style.display = 'inline-flex';

    html5QrCode = new Html5Qrcode("qr-reader");
    html5QrCode.start(
        { facingMode: "environment" },
        {
            fps: 10,
            qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
            handlePosScan(decodedText);
            // Pause slightly to avoid double scan
            setTimeout(() => document.getElementById('pos-barcode-input').focus(), 1500);
        },
        (err) => { }
    ).catch(async err => {
        await customAlert("Camera error: " + err);
        stopCameraScanner();
    });
}

function stopCameraScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            html5QrCode.clear();
            html5QrCode = null;
        }).catch(err => console.log(err));
    }
    document.getElementById('qr-reader-container').style.display = 'none';
    document.getElementById('btn-start-scanner').style.display = 'inline-flex';
    document.getElementById('btn-stop-scanner').style.display = 'none';
}

let globalScanner = null;
let isGlobalScanning = false; // Lock to prevent repeated beep/logic

async function openGlobalScanner(targetId) {
    if (isGlobalScanning) return;

    if (!window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
        await customAlert("⚠️ الكاميرا تحتاج لمتصفح آمن (HTTPS) لكي تعمل على الهاتف.\nCamera requires HTTPS to work on mobile devices.");
        return;
    }

    const modal = document.getElementById('global-scanner-modal');
    const loading = document.getElementById('scanner-loading');
    modal.style.display = 'flex';
    if (loading) loading.style.display = 'flex';

    globalScanner = new Html5Qrcode("global-qr-reader");
    const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
    };

    globalScanner.start(
        { facingMode: "environment" },
        config,
        async (decodedText) => {
            if (isGlobalScanning) return; // Prevent double trigger
            isGlobalScanning = true;

            posBeep(true);
            if (targetId === 's-product') {
                // ... existing product lookup logic ...
                const product = state.products.find(p => (p.barcodes && p.barcodes.includes(decodedText)) || p.barcode === decodedText || String(p.id) === decodedText);
                if (product) {
                    document.getElementById('s-product').value = product.id;
                    document.getElementById('s-product').dispatchEvent(new Event('change'));
                    closeGlobalScanner();
                } else {
                    // ...
                    await closeGlobalScanner();
                    const lang = document.documentElement.lang || 'en';
                    const msg = lang === 'ar'
                        ? `❌ المنتج غير موجود! (${decodedText})\nهل تريد إضافته الآن؟`
                        : `❌ Product not found! (${decodedText})\nDo you want to add it now?`;

                    if (await customConfirm(msg)) {
                        switchView('inventory', document.querySelectorAll('.nav-item')[1]);
                        // Put in the main barcode field
                        document.getElementById('p-barcode-main').value = decodedText;
                        // Clear modal barcodes for the new product
                        currentModalBarcodes = [];
                        updateBarcodeBadge();
                        window.scrollTo({ top: document.getElementById('product-form').offsetTop, behavior: 'smooth' });
                    }
                }
            } else if (targetId === null) {
                // Scan to Modal List Mode
                const inputs = document.querySelectorAll('.m-barcode-input');
                let targetInput = Array.from(inputs).find(i => i.value.trim() === '');
                if (!targetInput) {
                    addModalBarcodeRow(decodedText);
                } else {
                    targetInput.value = decodedText;
                    addModalBarcodeRow(); // Add next empty box automatically
                }
                isGlobalScanning = false;
                setTimeout(() => { isGlobalScanning = false; }, 1000);
            } else {
                document.getElementById(targetId).value = decodedText;
                closeGlobalScanner();
            }
        }
    ).then(() => {
        if (loading) loading.style.display = 'none';
    }).catch(async err => {
        console.error("Scanner Error:", err);
        if (loading) loading.style.display = 'none';
        await customAlert("❌ مشكل في الكاميرا: " + err);
        closeGlobalScanner();
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function closeGlobalScanner() {
    isGlobalScanning = false;
    if (globalScanner) {
        try {
            await globalScanner.stop();
            globalScanner.clear();
        } catch (e) { console.error(e); }
        globalScanner = null;
    }
    document.getElementById('global-scanner-modal').style.display = 'none';
}

// --- Sales Live Filter ---
function filterSalesDropdown(query) {
    const select = document.getElementById('s-product');
    const options = select.options;
    const q = query.toLowerCase();

    for (let i = 1; i < options.length; i++) { // Skip first "Select Product..."
        const text = options[i].text.toLowerCase();
        const isMatch = text.includes(q);
        options[i].style.display = isMatch ? "block" : "none";
        if (options[i].value === "custom") options[i].style.display = "block"; // Always show custom
    }
}
async function handlePosScan(code) {
    code = code.trim();
    if (!code) return;

    // Manual Entry & Barcode Lookup (Supporting array and legacy string)
    let product = state.products.find(p =>
        (p.barcodes && p.barcodes.includes(code)) ||
        p.barcode === code ||
        String(p.id) === code ||
        p.name.toLowerCase() === code.toLowerCase()
    );
    const lang = document.documentElement.lang || 'en';

    if (!product) {
        posBeep(false);
        if (await customConfirm(lang === 'ar' ? `❌ السلعة غير مسجلة!\nهل تريد إضافة منتج جديد باسم (${code})؟` : `❌ Product not found!\nDo you want to add a new product for (${code})?`)) {
            document.getElementById('pos-barcode-input').value = '';
            switchView('inventory', document.querySelectorAll('.nav-item')[1]);
            document.getElementById('p-barcode-main').value = code; // [BUG-6 FIXED] #p-barcode does not exist \u2014 correct ID is p-barcode-main
            window.scrollTo({ top: document.getElementById('product-form').offsetTop, behavior: 'smooth' });
        }
        document.getElementById('pos-barcode-input').value = '';
        return;
    }

    // Gram/KG Logic (Prompt)
    if (product.unit === 'g' || product.unit === 'kg') {
        posBeep(true);

        // Calculate Unit Price (per gram)
        // If unit is 'kg', itemSize is in kg, so we divide by (itemSize * 1000)
        // If unit is 'g', itemSize is in grams, so we divide by itemSize
        const pricePerGram = product.unit === 'kg'
            ? product.sellPrice / ((product.itemSize || 1) * 1000)
            : product.sellPrice / (product.itemSize || 1);

        const w = await customPrompt(lang === 'ar' ? `📦 وزن المنتج: ${product.name}` : `📦 Weight for: ${product.name}`, pricePerGram);

        if (!w || isNaN(w) || w <= 0) {
            document.getElementById('pos-barcode-input').value = '';
            return;
        }

        const qtyToDeduct = product.unit === 'kg' ? w / 1000 : w;

        if (product.qty < qtyToDeduct) {
            await customAlert(lang === 'ar' ? `❌ لا يوجد مخزون كافي: ${product.name}` : `❌ Insufficient stock: ${product.name}`);
            document.getElementById('pos-barcode-input').value = '';
            return;
        }

        const existingCartItem = posCart.find(c => c.id === product.id);
        if (existingCartItem) {
            existingCartItem.scannedCount += parseFloat(w); // scannedCount in grams
            // Use FIFO logic for preview
            const qtyToDeductTotal = product.unit === 'kg' ? existingCartItem.scannedCount / 1000 : existingCartItem.scannedCount;
            existingCartItem.totalPrice = sellFIFO(product, qtyToDeductTotal, true).revenue;
        } else {
            const qtyToDeductTotal = product.unit === 'kg' ? parseFloat(w) / 1000 : parseFloat(w);
            const previewRevenue = sellFIFO(product, qtyToDeductTotal, true).revenue;
            posCart.push({
                id: product.id,
                name: product.name,
                barcode: product.barcode || (product.barcodes ? product.barcodes[0] : ''),
                unit: product.unit,
                sellPrice: product.sellPrice,
                pricePerGram: pricePerGram,
                scannedCount: parseFloat(w),
                totalPrice: previewRevenue
            });
        }
        document.getElementById('pos-barcode-input').value = '';
        renderPosCart();
        return;
    }

    const existingCartItem = posCart.find(c => c.id === product.id);
    const scannedCount = existingCartItem ? existingCartItem.scannedCount : 0;
    const itemSize = product.itemSize || 1;
    const prosMathQty = product.unit === 'pcs' ? scannedCount + 1 : (scannedCount + 1) * itemSize;

    if (AppFinance.toInternal(product.qty) < AppFinance.toInternal(prosMathQty)) {
        posBeep(false);
        await customAlert(lang === 'ar' ? `❌ لا يوجد مخزون كافي للمنتج: ${product.name}` : `❌ Insufficient stock for: ${product.name}`);
        document.getElementById('pos-barcode-input').value = '';
        return;
    }

    posBeep(true);
    if (existingCartItem) {
        existingCartItem.scannedCount += 1;
        const totalToSell = product.unit === 'pcs' ? existingCartItem.scannedCount : existingCartItem.scannedCount * (product.itemSize || 1);
        existingCartItem.totalPrice = sellFIFO(product, totalToSell, true).revenue;
    } else {
        const totalToSell = product.unit === 'pcs' ? 1 : (product.itemSize || 1);
        const previewRevenue = sellFIFO(product, totalToSell, true).revenue;

        posCart.push({
            id: product.id,
            name: product.name,
            barcode: product.barcode || (product.barcodes ? product.barcodes[0] : ''),
            unit: product.unit,
            sellPrice: product.sellPrice,
            scannedCount: 1,
            totalPrice: previewRevenue
        });
    }

    document.getElementById('pos-barcode-input').value = '';
    document.getElementById('pos-barcode-input').focus();
    renderPosCart();
    // Silent log for debug
    console.log("Auto-Added:", product.name);
}

function changePosQty(productId, delta) {
    const item = posCart.find(c => c.id === productId);
    if (!item) return;

    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    const newCount = item.scannedCount + delta;
    if (newCount <= 0) {
        posCart = posCart.filter(c => c.id !== productId);
        renderPosCart();
        return;
    }

    const prosMathQty = product.unit === 'pcs' ? newCount : newCount * product.itemSize;
    if (AppFinance.toInternal(product.qty) < AppFinance.toInternal(prosMathQty)) {
        const lang = document.documentElement.lang || 'en';
        alert(lang === 'ar' ? '❌ لا يوجد مخزون كافي!' : '❌ Insufficient stock!');
        return;
    }

    item.scannedCount = newCount;
    const totalToSell = product.unit === 'pcs' ? item.scannedCount : item.scannedCount * (product.itemSize || 1);
    item.totalPrice = sellFIFO(product, totalToSell, true).revenue;
    renderPosCart();
}

function renderPosCart() {
    const list = document.getElementById('pos-cart-list');
    const totalEl = document.getElementById('pos-grand-total');
    const lang = document.documentElement.lang || 'en';

    if (posCart.length === 0) {
        list.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 3rem 1rem;">
                                    <i data-lucide="scan" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.3;"></i><br>
                                    <strong style="font-size: 1.2rem;">${lang === 'ar' ? 'السلة فارغة. قم بمسح الرمز الشريطي...' : 'Cart is empty. Scan barcode...'}</strong>
                                </td></tr>`;
        totalEl.innerHTML = "0 DA";
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    let grandTotal = 0;
    list.innerHTML = '';

    posCart.forEach(item => {
        const product = state.products.find(p => p.id === item.id);
        const bestPromo = AppFinance.getBestPromo(product, item.scannedCount);
        const isPromo = !!bestPromo;

        grandTotal += item.totalPrice;
        const tr = document.createElement('tr');
        tr.innerHTML = `
                    <td>
                        <strong style="display:block; margin-bottom: 0.2rem; color: var(--primary);">${item.name}</strong>
                        <span style="font-size: 0.8rem; color: var(--text-muted); font-family: monospace;">${item.barcode || '#' + item.id}</span>
                        ${isPromo ? '<br><span class="badge" style="background:var(--success); color:white; font-size:0.7rem; padding:0.1rem 0.4rem;">🔥 Promo Applied</span>' : ''}
                    </td>
                    <td dir="ltr">
                        ${isPromo ? `<s style="font-size:0.8rem; opacity:0.6; display:block;">${(item.scannedCount * item.sellPrice).toLocaleString()} DA</s>` : ''}
                        ${item.totalPrice.toLocaleString()} DA
                    </td>
                    <td>
                        <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: var(--card-bg); border: 1px solid var(--border); border-radius: 0.5rem; padding: 0.2rem;">
                            <button onclick="changePosQty(${item.id}, -1)" style="border:none; background:transparent; cursor:pointer; color: var(--danger); padding: 0.3rem;"><i data-lucide="minus"></i></button>
                            <span style="font-weight: 800; min-width: 1.5rem; text-align: center;">${formatQty(item.unit === 'kg' ? item.scannedCount / 1000 : item.scannedCount, item.unit)}</span>
                            <button onclick="changePosQty(${item.id}, 1)" style="border:none; background:transparent; cursor:pointer; color: var(--primary); padding: 0.3rem;"><i data-lucide="plus"></i></button>
                        </div>
                    </td>
                    <td dir="ltr" style="font-weight: bold;">${item.totalPrice.toLocaleString()} DA</td>
                    <td>
                        <button onclick="changePosQty(${item.id}, -9999)" style="background:transparent; border:none; color: var(--danger); cursor:pointer;"><i data-lucide="trash-2"></i></button>
                    </td>
                `;
        list.appendChild(tr);
    });

    totalEl.innerHTML = `${grandTotal.toLocaleString()} DA`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function printReceipt(cart, grandTotal) {
    const container = document.getElementById('print-receipt-container');
    const date = new Date().toLocaleString();
    let itemsHtml = cart.map(item => `
                <div class="ticket-item" style="border-bottom: 1px dashed #eee; padding: 2px 0;">
                    <div style="display:flex; justify-content:space-between; width:100%;">
                        <span style="flex:2; text-align: left;">${item.name.substring(0, 15)}</span>
                        <span style="flex:1; text-align: center;">${formatQty(item.scannedCount, item.unit)}</span>
                        <span style="flex:1; text-align: right;">${AppFinance.round(item.totalPrice).toFixed(2)}</span>
                    </div>
                    ${item.promoEnabled && item.scannedCount >= item.promoQty ? `<div style="font-size: 0.7rem; text-align:right; color:#666;">(<s>${(item.scannedCount * item.sellPrice).toFixed(2)}</s> Promo Applied)</div>` : ''}
                </div>
            `).join('');

    container.innerHTML = `
                <div class="ticket-header">
                    <h2>Animal Land</h2>
                    <div>${date}</div>
                </div>
                <div style="display:flex; justify-content:space-between; border-bottom: 1px solid #000; margin-bottom: 5px;">
                    <span style="flex:2; text-align: left;">Item</span>
                    <span style="flex:1; text-align: center;">Qty</span>
                    <span style="flex:1; text-align: right;">Total</span>
                </div>
                ${itemsHtml}
                <div class="ticket-total">
                    <span>GRAND TOTAL</span>
                    <span>${grandTotal.toLocaleString()} DA</span>
                </div>
                <div class="ticket-footer">
                    Thank you for your visit!<br>
                    --- Please keep this receipt ---
                </div>
            `;
    window.print();
}

async function posCheckout() {
    if (posCart.length === 0) return;
    const lang = document.documentElement.lang || 'en';

    if (!await customConfirm(lang === 'ar' ? '✅ إتمام البيع واستخراج الفاتورة؟' : '✅ Confirm Checkout & Print?')) return;

    const dateStr = new Date().toLocaleDateString();
    let totalSale = 0;
    const posCartCopy = JSON.parse(JSON.stringify(posCart));

    posCart.forEach(item => {
        const product = state.products.find(p => p.id === item.id);
        if (!product) return;

        let actualQty;
        if (product.unit === 'g' || product.unit === 'kg') {
            // They explicitly entered grams via the prompt, and scannedCount = grams entered.
            actualQty = product.unit === 'kg' ? item.scannedCount / 1000 : item.scannedCount;
        } else if (product.unit === 'pcs') {
            actualQty = item.scannedCount;
        } else {
            actualQty = item.scannedCount * (product.itemSize || 1);
        }

        // sellFIFO: deducts stock AND returns batch-accurate revenue + cost
        const saleResult = sellFIFO(product, actualQty);
        product.itemCount = AppFinance.stock(product.qty / (product.itemSize || 1));

        totalSale += saleResult.revenue;

        state.sales.push({
            id: Date.now() + Math.floor(Math.random() * 10000), // [BUG-3 FIXED] Float IDs fail === lookup after JSON roundtrip — delete/return was broken for POS sales
            productId: product.id,
            productName: product.name,
            qty: actualQty,
            unit: product.unit,
            price: product.sellPrice || 0,
            total: saleResult.revenue,
            cost: saleResult.cost,
            date: dateStr
        });
    });

    // REORDERED: Clear UI and Save FIRST, then print
    posCart = [];
    renderPosCart();
    if (typeof persistCart === "function") persistCart();
    saveState(); // Crucial: This calls renderAll() which updates the Sales list!

    // Print Receipt Call (This is blocking, so we do it last)
    printReceipt(posCartCopy, totalSale);

    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('pos-barcode-input').focus();
}

// Global keydown to catch hardware scanners acting as keyboards if POS view is active
let barcodeBuffer = "";
let barcodeTimer = null;
window.addEventListener('keydown', (e) => {
    const activeView = document.querySelector('.view-section.active');
    if (activeView && activeView.id === 'pos-view') {
        const activeEl = document.activeElement;
        const inputEl = document.getElementById('pos-barcode-input');

        // If it's a rapidly fired hardware scanner input
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            barcodeBuffer += e.key;
            clearTimeout(barcodeTimer);
            barcodeTimer = setTimeout(() => { barcodeBuffer = ""; }, 50); // fast scanner
        } else if (e.key === 'Enter') {
            // Check if it corresponds to buffered hardware scanner
            if (barcodeBuffer.length > 2) {
                e.preventDefault();
                handlePosScan(barcodeBuffer);
                barcodeBuffer = "";
                return;
            }

            // Allow simple 'Enter' to checkout if cart is not empty and no input actively typed
            if (posCart.length > 0 && barcodeBuffer.length === 0 && (!activeEl || activeEl.tagName !== 'INPUT' || activeEl.value === '')) {
                e.preventDefault();
                posCheckout();
                return;
            }
        }

        // Natural manual fallback
        if (activeEl.tagName !== 'INPUT' && activeEl.tagName !== 'TEXTAREA') {
            inputEl.focus();
        }
        if (e.key === 'Enter' && activeEl === inputEl && inputEl.value.trim() !== '') {
            handlePosScan(inputEl.value);
        }
    }
});

// --- BACKUP & RESTORE ---
function exportData() {
    if (!confirm("📥 تنزيل كل البيانات كملف النسخة الاحتياطية؟")) return;
    const dataStr = JSON.stringify(localStorage);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `animalland_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm("⚠️ تحذير: هذا سيمسح البيانات الحالية ويستبدلها بالنسخة المرفوعة. استمرار؟")) {
        e.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            localStorage.clear();
            for (let key in data) {
                localStorage.setItem(key, data[key]);
            }
            alert("✅ تم استرجاع البيانات بنجاح! سيتم إعادة تحميل التطبيق.");
            window.location.reload();
        } catch (error) {
            alert("❌ الملف تالف أو غير صالح!");
            console.error(error);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

// --- Database Sanitation ---
/**
 * Professional Database Sanitation Script
 * Iterates through all stored data to eliminate existing floating-point noise.
 * Ensures the system starts with a clean, high-precision state.
 */
function sanitizeDatabase() {
    console.log("[SYSTEM] Starting aggressive database sanitation...");
    let fixedCount = 0;

    state.products.forEach(p => {
        // Aggressive Snapping: If within 0.01 of an integer, FORCE it to that integer.
        // This fixes old corrupted data where 10 became 9.998.
        const snap = (val) => {
            if (typeof val !== 'number') return 0;
            const rounded = Math.round(val);
            if (Math.abs(val - rounded) < 0.01) return rounded;
            return AppFinance.safeNum(val);
        };

        const oldQty = p.qty;
        p.qty = snap(p.qty);
        p.initialQty = snap(p.initialQty);
        p.totalCost = AppFinance.round(p.totalCost);
        p.sellPrice = AppFinance.round(p.sellPrice);

        if (p.batches) {
            p.batches.forEach(b => {
                b.qty = snap(b.qty);
                b.cost = AppFinance.safeNum(b.cost);
                b.sellPrice = AppFinance.round(b.sellPrice);
            });
        }
        
        if (p.promos) {
            p.promos.forEach(pr => {
                pr.qty = snap(pr.qty);
                pr.price = AppFinance.round(pr.price);
            });
        }

        if (oldQty !== p.qty) fixedCount++;
    });

    state.sales.forEach(s => {
        s.qty = AppFinance.safeNum(s.qty);
        s.total = AppFinance.round(s.total);
        s.cost = AppFinance.round(s.cost);
    });

    if (fixedCount > 0) {
        console.log(`[SYSTEM] Sanitation complete. Repaired ${fixedCount} corrupted records.`);
        saveState();
    } else {
        console.log("[SYSTEM] Database is healthy.");
    }
}

// Initialize
initTheme();
initLang();
initPrivacy();
sanitizeDatabase(); // Clean DB on boot
document.getElementById('date-display').innerText = new Date().toDateString();
renderAll();

// Ensure icons are created for mobile header
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

// --- Duplicate Detection Logic ---
function checkDuplicateProduct() {
    const name = document.getElementById('p-name').value.trim().toLowerCase();
    const barcode = document.getElementById('p-barcode-main').value.trim();
    const warning = document.getElementById('duplicate-warning');
    const msg = document.getElementById('duplicate-msg');
    const btn = document.getElementById('duplicate-restock-btn');

    if (!name && !barcode) {
        warning.style.display = 'none';
        return;
    }

    const existing = state.products.find(p =>
        (name && p.name.toLowerCase() === name) ||
        (barcode && (p.barcode === barcode || (p.barcodes && p.barcodes.includes(barcode))))
    );

    if (existing) {
        const lang = document.documentElement.lang || 'en';
        msg.innerText = lang === 'ar' ? `⚠️ السلعة "${existing.name}" موجودة بالفعل!` : `⚠️ Product "${existing.name}" already exists!`;
        btn.onclick = () => restockProduct(existing.id);
        warning.style.display = 'block';
    } else {
        warning.style.display = 'none';
    }
}

function updateRestockPreview(id, mode = '') {
    const product = state.products.find(p => p.id === id);
    if (!product) return;
    const inputId = mode === 'm' ? `restock-bags-${id}-m` : `restock-bags-${id}`;
    const previewId = mode === 'm' ? `restock-preview-${id}-m` : `restock-preview-${id}`;
    const val = parseFloat(document.getElementById(inputId).value) || 0;
    const addedQty = val * (product.itemSize || 1);
    const total = product.qty + addedQty;
    const lang = document.documentElement.lang || 'en';

    const previewEl = document.getElementById(previewId);
    if (previewEl) {
        previewEl.innerText = lang === 'ar'
            ? `🔄 المجموع الجديد: ${formatQty(total, product.unit)}`
            : `🔄 New Total: ${formatQty(total, product.unit)}`;
    }
}

// --- Product Photo Logic ---
let currentImageProductId = null;
function openCameraForProduct(id) {
    currentImageProductId = id;
    document.getElementById('product-camera-input').click();
}

document.getElementById('product-camera-input').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file || !currentImageProductId) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
            // Resize/Compress to save localStorage space
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 120; // Small thumb is enough for PWA speed
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const base64 = canvas.toDataURL('image/jpeg', 0.6); // 60% quality compression
            const product = state.products.find(p => p.id === currentImageProductId);
            if (product) {
                product.image = base64;
                saveState();
            }
            currentImageProductId = null;
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// --- PWA Service Worker Registration ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registered!', reg))
            .catch(err => console.log('Service Worker registration failed: ', err));
    });
}

// Fix for charts not rendering on mobile load
window.addEventListener('load', () => {
    if (typeof myChart !== 'undefined' && myChart && typeof myChart.resize === 'function') {
        // Heavier delay and double trigger for buggy Android WebView
        setTimeout(() => {
            myChart.resize();
            myChart.update('none'); // silent update
            console.log("[DEBUG] Chart mobile forced render 1");
        }, 500);
        setTimeout(() => {
            myChart.resize();
            myChart.update();
            console.log("[DEBUG] Chart mobile forced render 2");
        }, 1500);
    }
});

// Close on ESC key
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('sidebar').classList.remove('mobile-open');
    }
});
