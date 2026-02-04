        const LOCAL_STORAGE_KEY = 'mis_notas_chile_web';
        const COOLDOWN_HOURS = 24;
        const STORAGE_KEY_LIMIT = 'contact_form_last_submit';
        

        // --- SISTEMA DE TEMAS SECRETOS 🤫 ---
const SECRET_THEMES = {
    'coffee': { name: 'Espresso', color: '#fff8e1', bg: '#3e2723', forced: 'light' },
    'retro':  { name: 'Retro Bit', color: '#33ff33', bg: '#050505', forced: 'dark' },
    'neon':   { name: 'Neon Nights', color: '#00f2ff', bg: '#1a0b2e', forced: 'dark' },
    'vaporwave': { name: 'Vaporwave', color: '#ff71ce', bg: '#ffdef3', forced: 'light' },
    'forest': { name: 'Forest Zen', color: '#a7c080', bg: '#2d353b', forced: 'dark' },
    'luxury': { name: 'Luxury Gold', color: '#d4af37', bg: '#0a0a0a', forced: 'dark' },
    'bw':     { name: 'Black & White', color: '#000000', bg: '#ffffff', forced: 'none' }, // 'none' permite ambos modos
    'blueprint': { name: 'Blueprint', color: '#a5f3fc', bg: '#083344', forced: 'dark' },
    'glitch': { name: 'System Error', color: '#22c55e', bg: '#000000', forced: 'dark' }
};


        let subjects = [];
        let manualGrades = [];
        // --- NUEVO CONTADOR GACHA ---
        let gachaAttempts = parseInt(localStorage.getItem('gacha_attempts')) || 0;
        let scaleMode = 'score'; // 'score' or 'percent'
        let examCalculationMode = 'need'; // Variable nueva para saber qué estamos calculando
        
        // --- VARIABLES PARA EL MODO GESTIÓN ---
        let tempSubjects = [];
        let manageIsDirty = false;

        // 1. INICIALIZACIÓN INTELIGENTE
function initTheme() {
    const savedTheme = localStorage.getItem('theme_color') || 'blue';
    const savedDark = localStorage.getItem('theme_dark');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // 1. Aplicamos el atributo al HTML
    if (savedTheme !== 'blue') {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        document.documentElement.removeAttribute('data-theme');
    }

    // 2. Lógica de Bloqueo Automática (Usando la lista maestra de arriba)
    const themeConfig = SECRET_THEMES[savedTheme];
    
    if (themeConfig && themeConfig.forced !== 'none') {
        // Si el tema obliga un modo, lo aplicamos a la fuerza
        if (themeConfig.forced === 'light') document.documentElement.classList.remove('dark');
        if (themeConfig.forced === 'dark') document.documentElement.classList.add('dark');
    } else {
        // Si no (temas normales o 'bw'), respetamos lo que quiera el usuario
        if (savedDark === 'true' || (savedDark === null && systemPrefersDark)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    highlightSelectedFont();
    if (typeof updateToggleUI === 'function') updateToggleUI(); 
}

        function toggleModal(modalId, isOpening) {
    const modal = document.getElementById(modalId);
    if (!modal) return; // Seguridad: si no existe el modal, no hace nada

    if (isOpening) {
        modal.classList.remove('hidden');
        history.pushState({ modalOpen: modalId }, "");

        // Casos especiales al abrir
        if (modalId === 'contact-modal') {
            checkFormLimit(); // Chequear límite de mensajes
        } else if (modalId === 'info-modal' && localStorage.getItem('theme_color') === 'coffee') {
            // --- PARCHE ESPRESSO: Ajustar colores en el modal de info ---
            setTimeout(() => {
                const h3s = modal.querySelectorAll('h3');
                let privacySection = null;
                h3s.forEach(h3 => {
                    if (h3.innerText.includes('Privacidad')) privacySection = h3.parentElement;
                });
                if (privacySection) {
                    const iconBox = privacySection.querySelector('div');
                    const iconSvg = privacySection.querySelector('svg');
                    if (iconBox) {
                        iconBox.style.backgroundColor = '#064e3b';
                        iconBox.style.border = '1px solid #10b981';
                        iconBox.style.opacity = '1';
                    }
                    if (iconSvg) {
                        iconSvg.style.color = '#34d399';
                        iconSvg.style.setProperty('stroke', '#34d399', 'important');
                    }
                }
            }, 100);
        }
    } else {
        modal.classList.add('hidden');
        if (history.state && history.state.modalOpen === modalId) {
            history.back();
        }
    }
}

        function toggleDarkMode() {
    // 1. Cambiar la clase real en el HTML
    document.documentElement.classList.toggle('dark');

    // 2. Guardar la preferencia del usuario
    localStorage.setItem('theme_dark', document.documentElement.classList.contains('dark'));

    // 3. ¡MOVER LA BOLITA! (Esto era lo que faltaba)
    updateToggleUI();
}

        function setTheme(colorName, save = true) {
    document.documentElement.setAttribute('data-theme', colorName);
    if(save) localStorage.setItem('theme_color', colorName);
    if(colorName === 'blue') document.documentElement.removeAttribute('data-theme');

    const themeConfig = SECRET_THEMES[colorName];

    // Si el tema tiene un modo forzado, lo aplicamos. Si es 'none' (como B&W) o no existe, usamos la memoria del usuario.
    if (themeConfig && themeConfig.forced !== 'none') {
        if (themeConfig.forced === 'light') document.documentElement.classList.remove('dark');
        else if (themeConfig.forced === 'dark') document.documentElement.classList.add('dark');
    } else {
        const savedDark = localStorage.getItem('theme_dark');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedDark === 'true' || (savedDark === null && systemPrefersDark)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    renderGrid();
    updateCalculations();
    updateToggleUI(); 
}

        // 3. ACTUALIZAR EL BOTÓN VISUALMENTE (Auxiliar)
            // 3. ACTUALIZAR EL BOTÓN VISUALMENTE (Con Bloqueo para Temas Especiales)
function updateToggleUI() {
    const btn = document.getElementById('dark-mode-toggle');
    if (!btn) return;
    
    const currentTheme = localStorage.getItem('theme_color') || 'blue';
    const themeConfig = SECRET_THEMES[currentTheme];
    
    // Verificamos si el tema actual tiene bloqueo (y que no sea 'none' como el B&W)
    const isLocked = themeConfig && themeConfig.forced && themeConfig.forced !== 'none';
    
    // --- 1. ESTADO DEL BOTÓN ---
    btn.disabled = isLocked;
    
    if (isLocked) {
        btn.classList.add('opacity-50', 'cursor-not-allowed', 'grayscale');
        btn.title = "Este tema tiene un modo de luz fijo";
    } else {
        btn.classList.remove('opacity-50', 'cursor-not-allowed', 'grayscale');
        btn.title = "Alternar Modo Oscuro";
    }

    // --- 2. MOVER LA BOLITA ---
    const isDark = document.documentElement.classList.contains('dark');
    const span = btn.querySelector('span:nth-child(2)');
    
    if (isDark) {
        // Estado ON (Derecha)
        span.classList.add('translate-x-6');
        span.classList.remove('translate-x-1');
        
        if (isLocked) {
            // Fondo gris oscuro si está bloqueado
            btn.classList.remove('bg-primary-600', 'bg-gray-200');
            btn.classList.add('bg-gray-600'); 
        } else {
            // Fondo de color normal
            btn.classList.add('bg-primary-600');
            btn.classList.remove('bg-gray-200', 'bg-gray-600');
        }
    } else {
        // Estado OFF (Izquierda)
        span.classList.remove('translate-x-6');
        span.classList.add('translate-x-1');
        
        btn.classList.remove('bg-primary-600', 'bg-gray-600');
        btn.classList.add('bg-gray-200');
    }
}

        function generateInitialData(count = 6) {
            return Array(count).fill(null).map((_, index) => ({
                id: Date.now() + index, 
                name: `Ramo ${index + 1}`,
                grades: Array(4).fill(null).map(() => ({ value: '', weight: '' })),
                isOpen: true
            }));
        }

        function loadData() {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
        try {
            subjects = JSON.parse(saved);
            if (!Array.isArray(subjects)) {
                subjects = generateInitialData(6);
            } else {
                // --- BLOQUE DE COMPATIBILIDAD V3 ---
                // Nos aseguramos de que todos los ramos cargados tengan isOpen: true
                subjects.forEach(sub => {
                    if (sub.isOpen === undefined){
                        sub.isOpen = true;
                    }
                });
                // -----------------------------------
            }
        } catch(e) { 
            subjects = generateInitialData(6); 
        }
    } else {
        subjects = generateInitialData(6);
    }
    renderGrid();
    updateCalculations();
    initCharCounter();
    
    const contactForm = document.getElementById('contact-form');
    if(contactForm) {
        // Agregamos 'e' (evento) para poder detener el envío si falla
        contactForm.addEventListener('submit', function(e) {
            
            // --- INICIO VALIDACIÓN ---
            const messageField = document.getElementById('message');
            const messageText = messageField.value.trim();

            // Verificamos si tiene menos de 15 caracteres
            if (messageText.length < 15) {
                e.preventDefault(); // 🛑 ESTO DETIENE EL ENVÍO A NETLIFY
                
                const faltan = 15 - messageText.length;
                
                // Mostramos la alerta (requiere la función showToast del Paso 2)
                showToast(`Escribe un poco más, por favor (faltan ${faltan} caracteres).`, 'warning');
                
                // Efecto de borde rojo
                messageField.classList.add('ring-2', 'ring-red-500');
                setTimeout(() => messageField.classList.remove('ring-2', 'ring-red-500'), 2000);
                
                return; // Salimos de la función
            }
            // --- FIN VALIDACIÓN ---

            // Si pasa la validación, guardamos la fecha y dejamos que se envíe
            localStorage.setItem(STORAGE_KEY_LIMIT, Date.now());
        });
    }
}


        function saveData() {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(subjects));
            const ind = document.getElementById('save-indicator');
            if(ind) {
                ind.style.opacity = '1';
                setTimeout(() => { ind.style.opacity = '0'; }, 1000);
            }
        }

        function addSubject() {
            if (subjects.length >= 8) return alert("Has alcanzado el máximo de 8 ramos.");
            subjects.push({ 
                id: Date.now(), 
                name: `Ramo ${subjects.length + 1}`, 
                grades: Array(4).fill(null).map(() => ({ value: '', weight: '' })),
                isOpen: true
            });
            saveData(); renderGrid(); updateCalculations();
        }
        function removeSubject() {
            if (subjects.length <= 4) return alert("El mínimo es de 4 ramos.");
            if (confirm("¿Eliminar el último ramo?")) { subjects.pop(); saveData(); renderGrid(); updateCalculations(); }
        }
        function addGrade(sIndex) { subjects[sIndex].grades.push({ value: '', weight: '' }); saveData(); renderGrid(); updateCalculations(); }
        function removeGrade(sIndex) { if (subjects[sIndex].grades.length > 1) { subjects[sIndex].grades.pop(); saveData(); renderGrid(); updateCalculations(); } }


        //RENDERGRID
        function renderGrid() {
    const grid = document.getElementById('subjects-grid');
    grid.innerHTML = '';
    const currentTheme = localStorage.getItem('theme_color') || 'blue';
    const isRedTheme = currentTheme === 'red';

    subjects.forEach((subject, sIndex) => {
        // Calculamos el promedio (usará la nueva lógica después)
        const finalAvg = calculateSubjectAvg(subject);
        
        let passingColorClass = isRedTheme ? 'text-gray-800 dark:text-gray-100' : 'text-primary-600 dark:text-primary-400';
        const getAvgColor = (val) => val === 0 ? 'text-gray-400' : (roundGrade(val) < 40 ? 'text-red-600 dark:text-red-400' : passingColorClass);

        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col min-w-[200px] fade-in transition-colors duration-300';
        
        // 1. CABECERA (Esta es la nueva versión con la Varita Mágica)
        // 1. CABECERA (Versión 3: Varita a la Izquierda + Icono Sparkles)
        // Copia desde aquí hasta el punto y coma final
        let html = `
            <div class="p-2 sm:p-3 bg-primary-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 rounded-t-lg flex items-center gap-1 sm:gap-2 relative z-10">
                
                <div class="relative flex-shrink-0">
                    <button onclick="toggleMagicMenu(${sIndex})" class="p-2 rounded-lg text-primary-500 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all group" title="Simular Notas" aria-label="Menú de simulación para ${subject.name}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover:scale-110 transition-transform">
                            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                            <path d="M5 3v4"/><path d="M9 3v4"/><path d="M3 5h4"/><path d="M3 9h4"/>
                        </svg>
                    </button>

                    <div id="magic-menu-${sIndex}" class="hidden absolute left-0 top-10 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-left">
                        <div class="p-2 space-y-1">
                            <button onclick="simulateNeeded(${sIndex})" class="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2">
                                <span class="text-lg">🛟</span>
                                <div><span class="block">Salvar el Ramo</span><span class="text-[10px] text-gray-400 font-normal">¿Qué nota necesito?</span></div>
                            </button>
                            <button onclick="simulateWorstCase(${sIndex})" class="w-full text-left px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2">
                                <span class="text-lg">☠️</span>
                                <div><span class="block">Peor Escenario</span><span class="text-[10px] text-red-400/70 font-normal">Rellenar con 1.0</span></div>
                            </button>
                            <div class="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                            <button onclick="clearGhosts(${sIndex})" class="w-full text-left px-3 py-2 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                Limpiar Simulación
                            </button>
                        </div>
                    </div>
                </div>

                <div class="flex-1 min-w-0">
                    <input type="text" value="${subject.name}" aria-label="Nombre del ramo" oninput="updateName(${sIndex}, this.value)" class="w-full bg-transparent font-semibold text-sm sm:text-base text-center text-gray-700 dark:text-gray-200 focus:outline-none focus:border-b-2 focus:border-primary-400 truncate"/>
                </div>

                <button onclick="toggleRamo(${sIndex})" aria-label="Mostrar u ocultar detalles" class="flex-shrink-0 block md:hidden p-1 text-gray-500 hover:text-primary-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 sm:h-6 sm:w-6 ${subject.isOpen ? 'hidden' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 sm:h-6 sm:w-6 ${subject.isOpen ? '' : 'hidden'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/>
                    </svg>
                </button>
            </div>

            <div id="details-${sIndex}" class="subject-details ${subject.isOpen ? 'open' : ''}">
                <div class="subject-details-inner">
                    <div class="ramo-content">
                        <div class="grid grid-cols-2 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 border-b border-gray-100 dark:border-gray-700">
                            <div class="text-center">NOTA</div>
                            <div class="text-center">%</div>
                        </div>
                        <div class="p-2 flex-grow">
        `;

        // Bucle de inputs
        subject.grades.forEach((grade, gIndex) => {
            const isHigh = parseFloat(grade.value) > 70;
            const highGradeClass = isHigh ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-800 dark:text-gray-200';
            html += `
                <div class="grid grid-cols-2 gap-2 mb-2">
                    <input type="number" min="0" placeholder="-" value="${grade.value}" aria-label="Nota ${gIndex + 1}" 
                        oninput="handleInput(${sIndex}, ${gIndex}, 'value', this)" onblur="handleBlur(${sIndex}, ${gIndex}, 'value', this)" 
                        class="grade-input w-full text-center p-1 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded text-sm ${highGradeClass}">
                    <input type="number" min="0" placeholder="%" value="${grade.weight}" aria-label="Porcentaje ${gIndex + 1}" 
                        oninput="handleInput(${sIndex}, ${gIndex}, 'weight', this)" onblur="handleBlur(${sIndex}, ${gIndex}, 'weight', this)" 
                        class="weight-input w-full text-center p-1 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded text-sm bg-gray-50 text-gray-500">
                </div>
            `;
        });

        // Botones + Barra de Estado Nueva
        html += `
                        <div class="flex items-center justify-center gap-2 mt-2 mb-2">
                            <button onclick="addGrade(${sIndex})" aria-label="Agregar nota a ${subject.name}" class="text-primary-500 bg-primary-50 dark:bg-gray-700 rounded-full p-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
                            <button onclick="removeGrade(${sIndex})" aria-label="Eliminar última nota de ${subject.name}" class="text-red-400 bg-red-50 dark:bg-red-900/20 rounded-full p-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
                        </div>
                        
                        <div id="percentage-status-${sIndex}" class="text-center text-xs font-medium text-gray-500 dark:text-gray-400 mt-3 mb-2 transition-colors duration-300">
                           0% Asignado
                        </div>

                    </div>
                </div>
            </div> 
        </div> 
        
        <div class="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg flex flex-col items-center justify-center">
            <span class="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Promedio</span>
            <div class="flex items-baseline gap-2" id="avg-display-${sIndex}">
                <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">${finalAvg > 0 ? finalAvg.toFixed(1) : '-'}</span>
                <span class="text-gray-300 text-[10px]">➜</span>
                <span class="text-xl font-bold ${getAvgColor(finalAvg)}">${finalAvg > 0 ? roundGrade(finalAvg) : '-'}</span>
            </div>
        </div>
        `;
        card.innerHTML = html;
        grid.appendChild(card);
    });
}

        function handleInput(sIndex, gIndex, field, inputElement) {
    // 1. Quitamos el estado de fantasma 
    inputElement.classList.remove('ghost-value');

    // 2. En lugar de borrar, reemplazamos puntos/comas y convertimos a número limpio
    let rawValue = inputElement.value.replace(/[,.]/g, ''); 
    
    // 3. Si el usuario escribió algo como "6.5", ahora es "65"
    // Actualizamos el campo visual solo si es necesario para no mover el cursor
    if (inputElement.value !== rawValue) {
        inputElement.value = rawValue;
    }

    const value = inputElement.value;
    if (value.includes('-')) return; // Evitamos números negativos 
    
    subjects[sIndex].grades[gIndex][field] = value;
    
    // 4. Lógica de colores según el rango 10-70 
    if (field === 'value') {
        if (parseFloat(value) > 70) {
            inputElement.classList.add('text-red-600', 'dark:text-red-400', 'font-bold');
            inputElement.classList.remove('text-gray-800', 'dark:text-gray-200');
        } else {
            inputElement.classList.remove('text-red-600', 'dark:text-red-400', 'font-bold');
            inputElement.classList.add('text-gray-800', 'dark:text-gray-200');
        }
    }
    
    saveData(); // Guardado automático en LocalStorage 
    updateCalculations(); // Recalcular promedios en tiempo real 
}

        function updateName(sIndex, value) { subjects[sIndex].name = value; saveData(); }
        function handleBlur(sIndex, gIndex, field, inputElement) {
            let currentVal = inputElement.value;
            if (field === 'value') {
                if (currentVal.length >= 3) currentVal = currentVal.substring(0, 2);
                else if (currentVal.length === 1 && /^\d$/.test(currentVal)) currentVal = currentVal + '0';
                inputElement.value = currentVal;
                subjects[sIndex].grades[gIndex].value = currentVal;
                if (parseFloat(currentVal) > 70) {
                    inputElement.classList.add('text-red-600', 'dark:text-red-400', 'font-bold');
                    inputElement.classList.remove('text-gray-800', 'dark:text-gray-200');
                } else {
                    inputElement.classList.remove('text-red-600', 'dark:text-red-400', 'font-bold');
                    inputElement.classList.add('text-gray-800', 'dark:text-gray-200');
                }
            } else if (field === 'weight') {
                const val = parseFloat(currentVal);
                if (!isNaN(val) && val > 100) {
                    inputElement.value = "";
                    subjects[sIndex].grades[gIndex].weight = "";
                }
            }
            saveData(); updateCalculations();
        }

        function handleEnter(e) { if (e.key === 'Enter') e.target.blur(); }

        function roundGrade(num) { return Math.round(num + 0.00001); }

        function updateCalculations() {
    let validSubjectAverages = [];
    
    subjects.forEach((subject, sIndex) => {
        // 1. Calculamos el promedio con la nueva lógica (ignora vacíos)
        const rawAvg = calculateSubjectAvg(subject);
        
        // 2. Calculamos el estado de los pesos para el Texto
        let totalAssignedWeight = 0;
        let hasEmptyGradesWithWeight = false;

        subject.grades.forEach(g => {
            const w = parseFloat(g.weight);
            const v = parseFloat(g.value);
            
            if(!isNaN(w)) {
                totalAssignedWeight += w;
                // Si hay peso pero NO hay nota, marcamos bandera
                if(isNaN(v)) hasEmptyGradesWithWeight = true;
            }
        });

        // 3. Actualizamos el Texto de Estado (El nuevo div)
        const statusElement = document.getElementById(`percentage-status-${sIndex}`);
        if(statusElement) {
            let statusText = "";
            let statusClass = "text-center text-xs font-medium mt-3 mb-2 transition-colors duration-300 ";

            // Corregimos decimales extraños (ej: 33.33333)
            const weightDisplay = parseFloat(totalAssignedWeight.toFixed(1));

            if (weightDisplay > 100) {
                // ERROR
                statusText = `⚠️ ¡${weightDisplay}% Total! (Te pasaste)`;
                statusClass += "text-red-500 font-bold animate-pulse";
            } else if (weightDisplay === 100 && !hasEmptyGradesWithWeight) {
                // ÉXITO (100% y todo con nota) -> AQUÍ ESTÁ EL CAMBIO DE COLOR
                statusText = "100% Completado ✓";
                statusClass += "text-emerald-700 dark:text-emerald-300 font-bold";
            } else if (weightDisplay === 100 && hasEmptyGradesWithWeight) {
                 // 100% ASIGNADO (Falta poner notas)
                 statusText = "100% Asignado (Faltan notas)";
                 statusClass += "text-blue-500 dark:text-blue-400";
            } else {
                // NORMAL
                const word = hasEmptyGradesWithWeight ? "Asignado" : "Evaluado";
                statusText = `${weightDisplay}% ${word}`;
                statusClass += "text-gray-500 dark:text-gray-400";
            }
            
            statusElement.textContent = statusText;
            statusElement.className = statusClass;
        }

        // 4. Actualizamos el Promedio Visual (Footer)
        const avgDisplay = document.getElementById(`avg-display-${sIndex}`);
        if(avgDisplay) {
            const rounded = roundGrade(rawAvg);
            
            // Lógica de colores del tema
            let themeColor = 'text-primary-600 dark:text-primary-400';
            if(localStorage.getItem('theme_color') === 'red') themeColor = 'text-gray-800 dark:text-gray-100';

            const color = rawAvg === 0 ? 'text-gray-500 dark:text-gray-500' : (rounded < 40 ? 'text-red-600 dark:text-red-400' : themeColor);
            
            avgDisplay.innerHTML = `
                <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">${rawAvg > 0 ? rawAvg.toFixed(1) : '-'}</span>
                <span class="text-gray-300 text-[10px]">➜</span>
                <span class="text-xl font-bold ${color}">${rawAvg > 0 ? rounded : '-'}</span>
            `;
        }
        
        if (rawAvg > 0) validSubjectAverages.push(roundGrade(rawAvg));
    });

    // 5. Cálculo del Semestre Global (Sin cambios)
    const semExactEl = document.getElementById('sem-exact');
    const semRoundedEl = document.getElementById('sem-rounded');
    if (validSubjectAverages.length > 0) {
        const total = validSubjectAverages.reduce((a, b) => a + b, 0);
        const semRaw = total / validSubjectAverages.length;
        const semRounded = roundGrade(semRaw);
        const isRed = semRounded < 40;
        const passingColorClass = (localStorage.getItem('theme_color') === 'red') ? 'text-gray-800 dark:text-gray-100' : 'text-primary-600 dark:text-primary-400';
        
        semExactEl.textContent = semRaw.toFixed(1);
        semRoundedEl.textContent = semRounded;
        semRoundedEl.className = `text-3xl md:text-5xl font-bold ${isRed ? 'text-red-600 dark:text-red-400' : passingColorClass}`;
    } else {
        semExactEl.textContent = '-';
        semRoundedEl.textContent = '-';
        semRoundedEl.className = 'text-3xl md:text-5xl font-bold text-gray-400 dark:text-gray-600';
    }
}

        function calculateSubjectAvg(subject) {
    let weightedSum = 0; 
    let usedWeight = 0; // Peso acumulado de notas QUE EXISTEN

    subject.grades.forEach(grade => {
        let valStr = grade.value ? grade.value.replace(',', '.') : '';
        const weightStr = grade.weight ? grade.weight.replace(',', '.') : '';
        
        let val = parseFloat(valStr);
        const weight = parseFloat(weightStr);

        // Solo calculamos si hay Porcentaje Y Nota válida
        if (!isNaN(weight) && weight > 0 && !isNaN(val)) {
            weightedSum += val * (weight / 100);
            usedWeight += (weight / 100);
        }
    });

    if (usedWeight === 0) return 0;
    
    // Matemática: Suma Ponderada / Peso Usado
    // Ejemplo: (7.0 * 0.3) / 0.3 = 7.0
    return weightedSum / usedWeight;
}

        function clearAllData() { if (confirm('¿Borrar todo?')) { subjects = generateInitialData(6); saveData(); renderGrid(); updateCalculations(); } }
        function exportBackup() {
            const link = document.createElement('a');
            link.href = 'data:application/json;charset=utf-8,'+ encodeURIComponent(JSON.stringify(subjects));
            link.download = 'respaldo_notas_chile.json';
            link.click();
        }
        function triggerImport() { document.getElementById('import-file').click(); }
        function importBackup(event) {
            const file = event.target.files[0];
            if(!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const parsed = JSON.parse(e.target.result);
                    if(Array.isArray(parsed)) { if(confirm('¿Cargar respaldo?')) { subjects = parsed; saveData(); renderGrid(); updateCalculations(); } }
                } catch(err) { alert('Error archivo'); }
            };
            reader.readAsText(file);
            event.target.value = '';
        }

function setExamMode(mode) {
    examCalculationMode = mode;
    
    // Elementos
    const bgPill = document.getElementById('exam-toggle-bg');
    const btnNeed = document.getElementById('mode-need');
    const btnFinal = document.getElementById('mode-final');
    const containerNeed = document.getElementById('calc-need-container');
    const containerFinal = document.getElementById('calc-final-container');

    // Estilos de texto (Activo vs Inactivo)
    const textActive = ['text-gray-800', 'dark:text-white', 'font-bold'];
    const textInactive = ['text-gray-500', 'dark:text-gray-400', 'font-medium'];

    if (mode === 'need') {
        // 1. MOVER EL FANTASMA (Izquierda)
        // translate-x-0 lo deja en su posición original (izquierda)
        bgPill.style.transform = 'translateX(0)';

        // 2. CAMBIAR COLORES DE TEXTO
        btnNeed.classList.remove(...textInactive);
        btnNeed.classList.add(...textActive);
        
        btnFinal.classList.remove(...textActive);
        btnFinal.classList.add(...textInactive);

        // 3. MOSTRAR CONTENIDO
        containerNeed.classList.remove('hidden');
        containerFinal.classList.add('hidden');
    } else {
        // 1. MOVER EL FANTASMA (Derecha)
        // translate-x-full lo mueve un 100% de su propio ancho + el gap
        bgPill.style.transform = 'translateX(100%)'; 
        // Ajuste fino: como tiene margen left-1, el 100% cae perfecto en el otro lado

        // 2. CAMBIAR COLORES DE TEXTO
        btnFinal.classList.remove(...textInactive);
        btnFinal.classList.add(...textActive);

        btnNeed.classList.remove(...textActive);
        btnNeed.classList.add(...textInactive);

        // 3. MOSTRAR CONTENIDO
        containerNeed.classList.add('hidden');
        containerFinal.classList.remove('hidden');
    }
    
    // Recalcular
    calculateExamLogic();
}

        let examSourceType = 'manual';
        function initManualGrades() { manualGrades = Array(3).fill(null).map(() => ({ value: '', weight: '' })); }
        function openExamCalculator() {
    document.getElementById('exam-modal').classList.remove('hidden');
    history.pushState({ modalOpen: 'exam-modal' }, ""); // Añadimos historial
    initManualGrades(); 
    renderManualGrades(); 
    updateExamSubjectSelect(); 
    setExamMode('need');
}

function closeExamCalculator() {
    document.getElementById('exam-modal').classList.add('hidden');
    // Limpiamos historial si el usuario cierra con el botón "Cerrar"
    if (history.state && history.state.modalOpen === 'exam-modal') {
        history.back();
    }
}
        function setExamSource(type) {
            examSourceType = type;
            const btnManual = document.getElementById('tab-manual');
            const btnSelect = document.getElementById('tab-select');
            const divManual = document.getElementById('source-manual-container');
            const divSelect = document.getElementById('source-select-container');
            const activeClass = "flex-1 py-1.5 text-sm font-medium rounded-md bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm transition-all";
            const inactiveClass = "flex-1 py-1.5 text-sm font-medium rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all";

            if (type === 'manual') {
                btnManual.className = activeClass; btnSelect.className = inactiveClass;
                divManual.classList.remove('hidden'); divSelect.classList.add('hidden');
            } else {
                btnSelect.className = activeClass; btnManual.className = inactiveClass;
                divManual.classList.add('hidden'); divSelect.classList.remove('hidden');
            }
            calculateExamLogic();
        }
        function renderManualGrades() {
            const container = document.getElementById('manual-grades-list');
            container.innerHTML = '';
            manualGrades.forEach((grade, index) => {
                const isHigh = parseFloat(grade.value) > 70;
                const highGradeClass = isHigh ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-800 dark:text-gray-200';
                const row = document.createElement('div');
                row.className = "grid grid-cols-2 gap-2";
                row.innerHTML = `
                    <input type="number" min="0" 
    placeholder="-" 
    value="${grade.value}" 
    aria-label="Calificación" 
    oninput="updateManualGrade(${index}, 'value', this)" 
    onblur="handleManualBlur(${index}, 'value', this)" 
    class="w-full text-center p-1 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded focus:ring-1 focus:ring-primary-500 focus:outline-none text-sm ${highGradeClass}">

<input type="number" min="0" 
    placeholder="%" 
    value="${grade.weight}" 
    aria-label="Peso porcentual" 
    oninput="updateManualGrade(${index}, 'weight', this)" 
    onblur="handleManualBlur(${index}, 'weight', this)" 
    class="w-full text-center p-1 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:outline-none text-sm bg-gray-50 text-gray-500">
                    `;
                container.appendChild(row);
            });
            calculateExamLogic();
        }
        function updateManualGrade(index, field, input) {
            if (input.value.includes('-')) return;
            manualGrades[index][field] = input.value;
            if (field === 'value') {
                if (parseFloat(input.value) > 70) {
                    input.classList.add('text-red-600', 'dark:text-red-400', 'font-bold');
                    input.classList.remove('text-gray-800', 'dark:text-gray-200');
                } else {
                    input.classList.remove('text-red-600', 'dark:text-red-400', 'font-bold');
                    input.classList.add('text-gray-800', 'dark:text-gray-200');
                }
            }
            calculateExamLogic();
        }
        function handleManualBlur(index, field, input) {
            let val = input.value;
            if (field === 'value') {
                if (val.length >= 3) val = val.substring(0, 2);
                else if (val.length === 1 && /^\d$/.test(val)) val = val + '0';
                input.value = val;
                manualGrades[index].value = val;
            } else if (field === 'weight') {
                if (parseFloat(val) > 100) { input.value = ""; manualGrades[index].weight = ""; }
            }
            calculateManualAverage(); 
            calculateExamLogic();
        }
        function addManualGrade() { manualGrades.push({ value: '', weight: '' }); renderManualGrades(); }
        function removeManualGrade() { if (manualGrades.length > 1) { manualGrades.pop(); renderManualGrades(); } }
        function calculateManualAverage() {
            let totalScore = 0; let totalWeight = 0;
            manualGrades.forEach(grade => {
                let val = parseFloat(grade.value);
                const weight = parseFloat(grade.weight);
                if (!isNaN(weight) && weight > 0) {
                    if (isNaN(val)) val = 0;
                    totalScore += val * (weight / 100);
                    totalWeight += (weight / 100);
                }
            });
            return totalWeight === 0 ? 0 : (totalScore / totalWeight);
        }
        function updateExamSubjectSelect() {
            const select = document.getElementById('exam-subject-select');
            select.innerHTML = '<option value="" disabled selected>Selecciona un ramo...</option>';
            subjects.forEach(sub => {
                const avg = calculateSubjectAvg(sub);
                if (avg > 0) {
                    const option = document.createElement('option');
                    option.value = avg;
                    option.text = `${sub.name} (Prom: ${avg.toFixed(1)})`;
                    select.appendChild(option);
                }
            });
        }
        function calculateExamLogic() {
    // 1. Obtener datos básicos
    const weightExam = parseFloat(document.getElementById('exam-weight').value) || 30;
    let currentGrade = 0;

    // Obtener nota de presentación (Manual o Select)
    if (examSourceType === 'manual') {
        currentGrade = calculateManualAverage();
        const display = document.getElementById('manual-avg-display');
        if (display) display.textContent = currentGrade > 0 ? currentGrade.toFixed(1) : '-';
    } else {
        currentGrade = parseFloat(document.getElementById('exam-subject-select').value) || 0;
    }

    const resultEl = document.getElementById('exam-result');
    const msgEl = document.getElementById('exam-message');

    // Si no hay nota de presentación, mostrar error
    if (!currentGrade) {
        resultEl.textContent = '-';
        msgEl.textContent = 'Falta nota de presentación';
        return;
    }

    // Cálculos comunes
    const wDec = weightExam / 100;
    const presWeight = 1 - wDec;

    let result, message, className;

    if (examCalculationMode === 'need') {
        const target = parseFloat(document.getElementById('exam-target').value) || 40;
        if (isNaN(target)) return;

        result = Math.ceil((target - (currentGrade * presWeight)) / wDec);
        message = `Nota mínima en el examen (${weightExam}%)`;

        if (result <= 0) {
            result = "¡Aprobado!";
            message = "Ya pasaste, incluso con un 1.0.";
            className = 'text-green-600 dark:text-green-400';
        } else if (result > 70) {
            className = 'text-red-600 dark:text-red-400';
            message = "Matemáticamente imposible :(";
        } else {
            className = 'text-primary-600 dark:text-primary-400';
        }
    } else {
        const examGrade = parseFloat(document.getElementById('exam-obtained').value);
        if (isNaN(examGrade)) {
            resultEl.textContent = '-';
            msgEl.textContent = 'Ingresa tu nota del examen';
            return;
        }

        result = Math.round((currentGrade * presWeight) + (examGrade * wDec));
        message = `Promedio Final (Exacto: ${(currentGrade * presWeight + examGrade * wDec).toFixed(1)})`;
        className = result < 40 ? 'text-red-600 dark:text-red-400' : 'text-primary-600 dark:text-primary-400';
    }

    // Actualizar UI
    resultEl.textContent = result;
    resultEl.className = `text-5xl font-black ${className}`;
    msgEl.textContent = message;
}

        // --- FUNCIONES NUEVA HERRAMIENTA ESCALA con las funciones de cerrar usando escape o la flechita del celu---
        function openScaleModal() { 
    document.getElementById('scale-modal').classList.remove('hidden');
    history.pushState({ modalOpen: 'scale-modal' }, ""); // Añadimos historial
    setScaleMode('score'); 
    calculateScaleGrade(); 
}

function closeScaleModal() {
    document.getElementById('scale-modal').classList.add('hidden');
    if (history.state && history.state.modalOpen === 'scale-modal') {
        history.back();
    }
}
        
        function setScaleMode(mode) {
            scaleMode = mode;
            const btnScore = document.getElementById('tab-score');
            const btnPercent = document.getElementById('tab-percent');
            const divScore = document.getElementById('input-score-container');
            const divPercent = document.getElementById('input-percent-container');
            const activeClass = "flex-1 py-1.5 text-sm font-medium rounded-md bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm transition-all";
            const inactiveClass = "flex-1 py-1.5 text-sm font-medium rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all";

            if (mode === 'score') {
                btnScore.className = activeClass; btnPercent.className = inactiveClass;
                divScore.classList.remove('hidden'); divPercent.classList.add('hidden');
            } else {
                btnPercent.className = activeClass; btnScore.className = inactiveClass;
                divScore.classList.add('hidden'); divPercent.classList.remove('hidden');
            }
            calculateScaleGrade();
        }

        function calculateScaleGrade() {
            const min = parseFloat(document.getElementById('scale-min').value) || 10;
            const max = parseFloat(document.getElementById('scale-max').value) || 70;
            const pass = parseFloat(document.getElementById('scale-pass').value) || 40;
            const demand = (parseFloat(document.getElementById('scale-demand').value) || 60) / 100;

            let achievement = 0; // 0 to 1

            if (scaleMode === 'score') {
                const scoreMax = parseFloat(document.getElementById('input-score-max').value);
                const scoreObtained = parseFloat(document.getElementById('input-score-obtained').value);
                if (scoreMax > 0 && !isNaN(scoreObtained)) {
                    achievement = scoreObtained / scoreMax;
                }
            } else {
                const percentVal = parseFloat(document.getElementById('input-percent-val').value);
                if (!isNaN(percentVal)) {
                    achievement = percentVal / 100;
                }
            }

            // Cap achievement 0-1
            if (achievement < 0) achievement = 0;
            // if (achievement > 1) achievement = 1; 

            let grade = 0;
            if (achievement < demand) {
                // Formula Bajos (Reprobados)
                grade = min + ((pass - min) * (achievement / demand));
            } else {
                // Formula Altos (Aprobados)
                grade = pass + ((max - pass) * ((achievement - demand) / (1 - demand)));
            }

            const resultExactEl = document.getElementById('scale-result-exact');
            const resultRoundedEl = document.getElementById('scale-result-rounded');
            
            if (isNaN(grade) || grade < min) grade = min;
            if (grade > max) grade = max;

            const gradeRounded = roundGrade(grade);
            const isRed = gradeRounded < pass;
            const passingColorClass = (localStorage.getItem('theme_color') === 'red') ? 'text-gray-800 dark:text-gray-100' : 'text-primary-600 dark:text-primary-400';

            resultExactEl.textContent = grade.toFixed(1);
            resultRoundedEl.textContent = gradeRounded;
            resultRoundedEl.className = `text-5xl font-black ${isRed ? 'text-red-600 dark:text-red-400' : passingColorClass}`;
        }

        // --- FUNCIONES GESTIONAR RAMOS (SANDBOX) ---
        function openManageModal() {
    tempSubjects = JSON.parse(JSON.stringify(subjects)); // Crear copia temporal
    manageIsDirty = false; // Resetear bandera de cambios
    
    document.getElementById('manage-modal').classList.remove('hidden');
    
    // ESTA LÍNEA ES LA CLAVE PARA EL CELULAR:
    history.pushState({ modalOpen: 'manage-modal' }, ""); 
    
    renderManageList();
}

        function closeManageModal() {
    // 1. Si hay cambios, pedimos confirmación
    if (manageIsDirty) {
        if (!confirm("Tienes cambios sin guardar. ¿Seguro que quieres salir?")) {
            return; // Si cancela, no hace nada y el modal sigue abierto
        }
    }
    
    // 2. Si no hay cambios o aceptó salir, cerramos
    document.getElementById('manage-modal').classList.add('hidden');
    manageIsDirty = false; // Reseteamos la bandera

    // 3. Limpiamos el historial para que el botón "atrás" no quede bucleado
    if (history.state && history.state.modalOpen === 'manage-modal') {
        history.back();
    }
}

        function renderManageList() {
            const listContainer = document.getElementById('manage-list');
            listContainer.innerHTML = '';
            
            tempSubjects.forEach((subj, index) => {
                const isFirst = index === 0;
                const isLast = index === tempSubjects.length - 1;
                
                // Botón SUBIR: Desactivado si es el primero
                const btnUpClass = isFirst ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30';
                const btnUpAction = isFirst ? '' : `onclick="moveSubject(${index}, -1)"`;

                // Botón BAJAR: Desactivado si es el último
                const btnDownClass = isLast ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30';
                const btnDownAction = isLast ? '' : `onclick="moveSubject(${index}, 1)"`;

                const row = document.createElement('div');
                row.className = "flex justify-between items-center bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-100 dark:border-gray-600 mb-2";
                
                row.innerHTML = `
    <span class="font-medium text-sm text-gray-700 dark:text-gray-200 truncate pr-2">${subj.name}</span>
    <div class="flex items-center gap-1">
        <button type="button" ${btnUpAction} 
                class="p-2 rounded transition-colors ${btnUpClass}" 
                aria-label="Mover ramo ${subj.name} hacia arriba" 
                title="Subir">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
        </button>

        <button type="button" ${btnDownAction} 
                class="p-2 rounded transition-colors ${btnDownClass}" 
                aria-label="Mover ramo ${subj.name} hacia abajo" 
                title="Bajar">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
        </button>

        <button type="button" onclick="deleteSubjectFromManage(${index})" 
                class="p-2 ml-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" 
                aria-label="Eliminar ramo ${subj.name}" 
                title="Eliminar">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
    </div>
`;
                listContainer.appendChild(row);
            });
        }

        function moveSubject(index, direction) {
            // direction: -1 (subir), 1 (bajar)
            const newIndex = index + direction;
            if (newIndex < 0 || newIndex >= tempSubjects.length) return;

            // Swap
            const item = tempSubjects[index];
            tempSubjects.splice(index, 1);
            tempSubjects.splice(newIndex, 0, item);

            manageIsDirty = true;
            renderManageList();
        }

        function deleteSubjectFromManage(index) {
            // Validar mínimo 4 ramos
            if (tempSubjects.length <= 4) {
                alert("Debes mantener al menos 4 ramos.");
                return;
            }
            if (confirm(`¿Eliminar ${tempSubjects[index].name}? Esta acción borrará sus notas.`)) {
                tempSubjects.splice(index, 1);

                manageIsDirty = true;
                renderManageList();
            }
        }

        function saveManageChanges() {
    subjects = JSON.parse(JSON.stringify(tempSubjects)); // Aplicar cambios
    saveData();
    
    // --- NUEVO: Decimos que ya no hay cambios sin guardar ---
    manageIsDirty = false; 

    renderGrid();
    updateCalculations();
    
    // Cerramos el modal
    document.getElementById('manage-modal').classList.add('hidden');

    // --- NUEVO: Quitamos la marca del historial porque cerramos manualmente ---
    if (history.state && history.state.modalOpen === 'manage-modal') {
        history.back();
    }
}


        function checkFormLimit() {
            const lastSubmit = localStorage.getItem(STORAGE_KEY_LIMIT);
            if (!lastSubmit) return; 

            const now = Date.now();
            const diff = now - parseInt(lastSubmit);
            const hoursMs = COOLDOWN_HOURS * 60 * 60 * 1000;

            if (diff < hoursMs) {
                const btn = document.getElementById('submit-btn');
                const msg = document.getElementById('limit-message');
                const timeSpan = document.getElementById('time-remaining');
                
                if(btn && msg && timeSpan) {
                    btn.disabled = true;
                    btn.classList.add('opacity-50', 'cursor-not-allowed');
                    const btnText = document.getElementById('btn-text');
                    const btnIcon = document.getElementById('btn-icon');
                    if(btnText) btnText.innerText = 'Límite alcanzado';
                    if(btnIcon) btnIcon.style.display = 'none';

                    const remainingMs = hoursMs - diff;
                    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
                    const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
                    
                    timeSpan.innerText = `${remainingHours}h ${remainingMinutes}m`;
                    msg.classList.remove('hidden');
                }
            }
        }

        function initCharCounter() {
            const messageInput = document.getElementById('message');
            const charCountDisplay = document.getElementById('char-current');
            if (messageInput && charCountDisplay) {
                messageInput.oninput = function() {
                    const currentLength = this.value.length;
                    charCountDisplay.textContent = currentLength;
                    if (currentLength >= 450) {
                        charCountDisplay.classList.add('text-red-500', 'font-bold');
                    } else {
                        charCountDisplay.classList.remove('text-red-500', 'font-bold');
                    }
                };
            }
        }

        initTheme();
        highlightSelectedFont();
        // --- LÓGICA DE TIPOGRAFÍA ---
        function setFont(fontName) {
            document.body.classList.remove('font-sans', 'font-serif', 'font-hand', 'font-mono');
            document.body.classList.add('font-' + fontName);
            localStorage.setItem('theme_font', fontName);
            highlightSelectedFont();
        }

        function highlightSelectedFont() {
            const fonts = ['sans', 'serif', 'hand', 'mono'];
            const currentFont = localStorage.getItem('theme_font') || 'sans';

            // Asegurar que el body tenga la clase al cargar
            if (!document.body.classList.contains('font-' + currentFont)) {
                document.body.classList.add('font-' + currentFont);
            }

            fonts.forEach(f => {
                const btn = document.getElementById('btn-font-' + f);
                if(!btn) return;
                const check = btn.querySelector('.check-icon');
                
                // Reset a estado inactivo (Base + Dark Mode compatible)
                btn.className = `w-full flex items-center justify-between p-2.5 border rounded-lg transition-all group font-${f} bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-primary-400 dark:hover:border-primary-400`;
                check.classList.add('hidden');

                if (f === currentFont) {
                    // Estado Activo (Borde Primario + Fondo suave + Texto Primario)
                    btn.classList.remove('bg-gray-50', 'dark:bg-gray-700/50', 'border-gray-200', 'dark:border-gray-600', 'text-gray-700', 'dark:text-gray-200');
                    btn.classList.add('border-primary-500', 'dark:border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20', 'text-primary-700', 'dark:text-primary-400');
                    check.classList.remove('hidden');
                }
            });
        }
        
        function toggleRamo(sIndex) {
    // 1. Cambiamos el dato
    subjects[sIndex].isOpen = !subjects[sIndex].isOpen;
    saveData();

    // 2. Buscamos los elementos en el HTML
    const details = document.getElementById(`details-${sIndex}`);
    const button = details.closest('.bg-white, .dark\\:bg-gray-800').querySelector('button[onclick*="toggleRamo"]');
    const eyeOpen = button.querySelector('svg:nth-child(1)');
    const eyeClosed = button.querySelector('svg:nth-child(2)');

    // 3. Animación: Ponemos o quitamos la clase .open
    if (subjects[sIndex].isOpen) {
        details.classList.add('open');
        eyeOpen.classList.add('hidden');    // Escondemos ojo normal
        eyeClosed.classList.remove('hidden'); // Mostramos ojo tachado
    } else {
        details.classList.remove('open');
        eyeOpen.classList.remove('hidden'); // Mostramos ojo normal
        eyeClosed.classList.add('hidden');    // Escondemos ojo tachado
    }
}

// --- LÓGICA DE NAVEGACIÓN V3 (Atrás y Escape) ---

// 1. Detectar el botón "Atrás" del celular
window.onpopstate = function(event) {
    const manageModal = document.getElementById('manage-modal');
    
    // 1. Revisamos si el modal de gestión está abierto y si hay cambios sin guardar
    if (manageModal && !manageModal.classList.contains('hidden') && manageIsDirty) {
        if (!confirm("Tienes cambios sin guardar. ¿Seguro que quieres salir?")) {
            // Si el usuario cancela, volvemos a meter el estado en el historial 
            // para que el próximo "atrás" vuelva a ser capturado.
            history.pushState({ modalOpen: 'manage-modal' }, ""); 
            return; // Detenemos la función aquí, no cerramos nada
        }
    }

    // 2. Si no hay cambios o no es el modal de gestión, cerramos todo normal
    const modales = ['theme-modal', 'info-modal', 'exam-modal', 'scale-modal', 'manage-modal', 'contact-modal', 'story-modal'];
    modales.forEach(id => {
        const m = document.getElementById(id);
        if (m) m.classList.add('hidden');
    });
    
    // Al cerrar todo con éxito, reseteamos la bandera
    manageIsDirty = false;
};

// 2. Detectar la tecla Escape en PC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const manageModal = document.getElementById('manage-modal');
        
        // Si el modal de gestión está abierto, usamos la lógica de cierre seguro
        if (manageModal && !manageModal.classList.contains('hidden')) {
            closeManageModal(); 
            return; // Importante para que no ejecute el cierre general de abajo
        }

        // Cierre normal para el resto de los modales
        const modales = ['theme-modal', 'info-modal', 'exam-modal', 'scale-modal', 'contact-modal'];
        modales.forEach(id => {
            const m = document.getElementById(id);
            if (m && !m.classList.contains('hidden')) {
                m.classList.add('hidden');
                if (history.state && history.state.modalOpen === id) history.back();
            }
        });
    }
});


// --- EASTER EGG & PREMIO ---
function openStoryModal() {
    const modal = document.getElementById('story-modal');
    modal.classList.remove('hidden');
    history.pushState({ modalOpen: 'story-modal' }, "");
}

function closeStoryModal() {
    const modal = document.getElementById('story-modal');
    modal.classList.add('hidden');
    if (history.state && history.state.modalOpen === 'story-modal') {
        history.back();
    }
}

function unlockSecretTheme() {
    setTheme('neon')
    
    // Forzamos el modo oscuro para que los íconos se vean blancos
    document.documentElement.classList.add('dark');
    
    // Feedback visual en el botón
    const btn = document.getElementById('btn-secret');
    btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        ¡Tema Neón Aplicado!
    `;
    // Botón verde esmeralda para confirmar éxito
    btn.className = "bg-emerald-600 text-white font-bold py-2 px-4 rounded-full text-xs shadow-lg flex items-center gap-2 mx-auto cursor-default";
    
    // Cambio de título temporal (Confeti)
    const originalTitle = document.title;
    document.title = "💜 ¡Modo Neón Desbloqueado! 💜";
    setTimeout(() => { document.title = originalTitle; closeStoryModal(); }, 1500);

    // Forzar color hueso al texto de la historia real
setTimeout(() => {
    const storyText = document.querySelector('#story-modal .story-subtitle');
    if (storyText) {
        storyText.style.setProperty('color', '#fefce8', 'important');
        storyText.style.setProperty('opacity', '1', 'important');
    }
}, 10); // Un pequeño retraso para asegurar que el modal ya existe
}


// --- SECUENCIA HACKER (Easter Egg) ---
// --- SECUENCIA HACKER 2.0 (GACHA) ---
// --- SECUENCIA HACKER (Versión Limpia y Estable) ---
// --- SECUENCIA HACKER (Versión Clásica - La que funciona) ---
// --- SECUENCIA HACKER (Versión Limpia) ---
// --- SECUENCIA HACKER (Versión Final: Bloqueo + Estado "Hecho") ---
function runHackerSequence() {
    const termContent = document.getElementById('terminal-content');
    const btnInit = document.getElementById('btn-init-hack');
    const btnReward = document.getElementById('btn-secret-reward');
    const terminal = document.getElementById('hacker-terminal');

    // 1. ESTADO "CORRIENDO": Bloqueo inmediato
    btnInit.disabled = true; 
    // Usamos un spinner para indicar que está pensando
    btnInit.innerHTML = `<span class="animate-spin mr-2">⟳</span> PROCESANDO...`;
    btnInit.classList.add('opacity-50', 'cursor-not-allowed');
    btnInit.classList.remove('hover:bg-gray-700', 'active:scale-95');

    // 2. Aumentar contador
    gachaAttempts++;
    localStorage.setItem('gacha_attempts', gachaAttempts);
    const attemptString = String(gachaAttempts).padStart(4, '0');

    // Reset visual
    if(btnReward) btnReward.classList.add('hidden');
    
    // Header
    termContent.innerHTML = `<p class="text-blue-400">> Iniciando secuencia...</p>
                             <p class="text-gray-500">> SCRIPTS_RUN: [${attemptString}]</p>`;

    // 3. Lógica Gacha (Probabilidades)
    const roll = Math.random() * 100;
    let resultType = 'fail';
    let prizeTheme = '';

    if (roll < 20) { resultType = 'fail'; } 
    else if (roll < 35) { resultType = 'success'; prizeTheme = 'coffee'; }
    else if (roll < 45) { resultType = 'success'; prizeTheme = 'vaporwave'; }
    else if (roll < 55) { resultType = 'success'; prizeTheme = 'forest'; }
    else if (roll < 65) { resultType = 'success'; prizeTheme = 'bw'; }
    else if (roll < 75) { resultType = 'success'; prizeTheme = 'blueprint'; }
    else if (roll < 85) { resultType = 'success'; prizeTheme = 'retro'; }
    else if (roll < 92) { resultType = 'success'; prizeTheme = 'glitch'; }
    else if (roll < 97) { resultType = 'success'; prizeTheme = 'neon'; }
    else { resultType = 'success'; prizeTheme = 'luxury'; }

    // 4. Guión de espera
    let lines = [];
    lines.push({ text: '> Bypass firewall...', color: 'text-yellow-400', delay: 600 });
    lines.push({ text: '> Inyectando payload...', color: 'text-blue-300', delay: 1400 });
    lines.push({ text: '> Descifrando hash...', color: 'text-purple-300', delay: 2400 });

    if (resultType === 'fail') {
        lines.push({ text: '> [ERROR] Conexión rechazada.', color: 'text-red-500', delay: 3200 });
        lines.push({ text: '> FALLO DEL SISTEMA.', color: 'text-red-600 font-bold', delay: 3800 });
    } else {
        lines.push({ text: '> Acceso Root: OK.', color: 'text-green-400', delay: 3200 });
        lines.push({ text: `> Archivo: ${SECRET_THEMES[prizeTheme].name}.css`, color: 'text-purple-300', delay: 4000 });
        lines.push({ text: '> ¡INSTALACIÓN EXITOSA!', color: 'text-green-500 font-bold animate-pulse', delay: 4500 });
    }

    // Ejecutar líneas
    lines.forEach(line => {
        setTimeout(() => {
            const p = document.createElement('p');
            p.innerHTML = line.text;
            
            // Inyección de colores
            const colorMap = {
                'text-yellow-400': '#fbbf24', 'text-blue-300': '#93c5fd',
                'text-blue-400': '#60a5fa', 'text-red-500': '#ef4444',
                'text-red-600': '#dc2626', 'text-green-400': '#4ade80',
                'text-green-500': '#22c55e', 'text-purple-300': '#d8b4fe',
                'text-cyan-400': '#22d3ee', 'text-gray-400': '#9ca3af'
            };
            const colorClass = line.color.split(' ')[0];
            const finalHex = colorMap[colorClass] || '#9ca3af';
            p.style.setProperty('color', finalHex, 'important');

            termContent.appendChild(p);
            terminal.scrollTop = terminal.scrollHeight;
        }, line.delay);
    });

    // 5. FINALIZACIÓN (Cambio de estado)
    const totalTime = resultType === 'fail' ? 4000 : 4800;

    setTimeout(() => {
        // A) CAMBIO VISUAL DEL BOTÓN PRINCIPAL
        // Quitamos el spinner y ponemos un check. Sigue disabled.
        btnInit.innerHTML = `<span class="font-bold">✓ HECHO</span>`;
        // Opcional: Cambiamos un poco el borde para indicar que acabó
        btnInit.classList.remove('border-green-500/30'); 
        btnInit.classList.add('border-gray-600'); 

        // B) MENSAJE DE RESULTADO
        if (resultType === 'success') {
            const isNew = unlockNewTheme(prizeTheme);
            setTheme(prizeTheme);
            const winMsg = document.createElement('div');
            winMsg.className = "mt-3 bg-gray-900 p-2 rounded border border-green-500 text-center mb-2 animate-in zoom-in";
            winMsg.innerHTML = isNew 
                ? `<span class="text-yellow-400 font-bold">✨ ¡NUEVO: ${SECRET_THEMES[prizeTheme].name}! ✨</span>`
                : `<span class="text-gray-400">Repetido: ${SECRET_THEMES[prizeTheme].name}</span>`;
            termContent.appendChild(winMsg);
        }
        
        // C) BOTÓN DE REINICIO
        const retryBtn = document.createElement('button');
        retryBtn.className = "mt-4 mb-2 text-xs font-mono font-bold text-cyan-400 hover:text-white hover:bg-cyan-900/50 py-3 px-3 border border-cyan-800 rounded w-full transition-colors animate-pulse";        
        retryBtn.innerText = resultType === 'fail' ? "[ ↻ REINICIAR SISTEMA ]" : "[ 🔍 BUSCAR OTRO ]";
        
        retryBtn.onclick = () => {
            // RESTAURAR TODO AL ESTADO INICIAL
            termContent.innerHTML = '<p class="text-green-500">> Sistema listo...</p><p class="text-gray-500 animate-pulse">> Esperando comando...</p>';
            
            // Reactivamos el botón principal
            btnInit.disabled = false;
            btnInit.innerHTML = `<span class="mr-2 animate-pulse">►</span> EJECUTAR_SCRIPT`;
            
            // Restauramos estilos originales
            btnInit.classList.remove('opacity-50', 'cursor-not-allowed', 'border-gray-600');
            btnInit.classList.add('hover:bg-gray-700', 'active:scale-95', 'border-green-500/30');
        };
        
        termContent.appendChild(retryBtn);
        terminal.scrollTop = terminal.scrollHeight;
        
    }, totalTime);
}

function toggleMagicMenu(sIndex) {
    const menu = document.getElementById(`magic-menu-${sIndex}`);
    // Buscamos el bloque completo del ramo (la "card")
    const allCards = document.querySelectorAll('#subjects-grid > div');
    const currentCard = menu.closest('#subjects-grid > div');

    // 1. Cerramos otros menús y reseteamos la prioridad de todas las tarjetas
    subjects.forEach((_, idx) => {
        if (idx !== sIndex) {
            const otherMenu = document.getElementById(`magic-menu-${idx}`);
            if (otherMenu) otherMenu.classList.add('hidden');
        }
    });
    
    // Reset de capas: todos vuelven al nivel 1
    allCards.forEach(card => {
        card.style.zIndex = "1";
        card.style.position = "relative"; 
    });

    // 2. Abrir/Cerrar el menú actual y subir su capa
    if (menu) {
        const isHidden = menu.classList.contains('hidden');
        if (isHidden) {
            menu.classList.remove('hidden');
            currentCard.style.zIndex = "50"; // ¡Este ramo ahora está sobre todos!
        } else {
            menu.classList.add('hidden');
            currentCard.style.zIndex = "1";
        }
    }
}



// --- LÓGICA DE SIMULACIÓN (Fase 3) ---
// --- LÓGICA DE SIMULACIÓN (V2 - Corregida escala 10-70) ---

// 1. LIMPIAR FANTASMAS (Igual que antes, pero asegúrate de tenerla)
function clearGhosts(sIndex) {
    const card = document.getElementById(`details-${sIndex}`);
    const ghosts = card.querySelectorAll('.ghost-value');
    
    ghosts.forEach(input => {
        input.value = ""; 
        input.classList.remove('ghost-value');
        
        const onInputAttr = input.getAttribute('oninput'); 
        const parts = onInputAttr.split(','); 
        const gIndex = parseInt(parts[1]); 
        
        const field = input.classList.contains('weight-input') ? 'weight' : 'value';
        subjects[sIndex].grades[gIndex][field] = "";
    });

    updateCalculations(); 
    toggleMagicMenu(sIndex); 
}

// 2. PEOR ESCENARIO (Ahora pone "10" en vez de "1.0") ☠️
function simulateWorstCase(sIndex) {
    clearGhosts(sIndex);
    
    const subject = subjects[sIndex];
    let madeChanges = false;

    // Calcular peso faltante
    let currentWeight = 0;
    subject.grades.forEach(g => {
        if (g.weight) currentWeight += parseFloat(g.weight);
    });
    let remainingWeight = 100 - currentWeight;

    subject.grades.forEach((grade, gIndex) => {
        const card = document.getElementById(`details-${sIndex}`);
        const rowInputs = card.querySelectorAll('.grade-input');
        const weightInputs = card.querySelectorAll('.weight-input');
        
        const inputGrade = rowInputs[gIndex];
        const inputWeight = weightInputs[gIndex];

        // CASO A: Tiene % pero no nota -> Ponemos "10" (Nota mínima)
        if (grade.weight && !grade.value) {
            inputGrade.value = "10"; // CORREGIDO: 10 en vez de 1.0
            inputGrade.classList.add('ghost-value');
            subject.grades[gIndex].value = "10";
            madeChanges = true;
        }

        // CASO B: Hueco total -> Ponemos el resto del peso y nota "10"
        else if (!grade.weight && !grade.value && remainingWeight > 0) {
            inputWeight.value = remainingWeight;
            inputWeight.classList.add('ghost-value');
            subject.grades[gIndex].weight = remainingWeight.toString();
            
            inputGrade.value = "10"; // CORREGIDO: 10 en vez de 1.0
            inputGrade.classList.add('ghost-value');
            subject.grades[gIndex].value = "10";
            
            remainingWeight = 0; 
            madeChanges = true;
        }
    });

    if (madeChanges) updateCalculations();
    else alert("No hay espacios vacíos para simular.");
}

// 3. SALVAR EL RAMO (Ahora rellena TODOS los huecos y usa escala 10-70) 🛟
function simulateNeeded(sIndex) {
    clearGhosts(sIndex); 

    const subject = subjects[sIndex];
    
    // 1. Calcular puntos actuales (Escala 10-70)
    let currentPoints = 0; 
    let currentTotalWeight = 0; 
    
    subject.grades.forEach(g => {
        // Usamos lógica robusta: si hay valor, lo usamos. Si no, 0.
        const w = parseFloat(g.weight);
        const v = parseFloat(g.value);
        
        if (!isNaN(w)) {
            if (!isNaN(v)) {
                // Ya tiene nota
                currentPoints += v * (w / 100);
            }
            currentTotalWeight += w;
        }
    });

    const targetAvg = 40; // CORREGIDO: Meta es 40, no 4.0
    let remainingWeight = 100 - currentTotalWeight;
    let weightAvailableToFill = 0;

    // Detectar dónde podemos escribir (huecos vacíos o huecos nuevos)
    // Escenario 1: Huecos que ya tienen % pero no nota
    subject.grades.forEach(g => {
        if (g.weight && !g.value) weightAvailableToFill += parseFloat(g.weight);
    });

    // Escenario 2: Si falta peso para el 100%, ese peso también está disponible
    if (remainingWeight > 0) {
        weightAvailableToFill += remainingWeight;
    }

    if (weightAvailableToFill <= 0) {
        alert("¡Ya tienes el 100% evaluado con notas! No puedo simular nada.");
        return;
    }

    // FÓRMULA MAESTRA:
    // (Meta - PuntosQueLlevo) / (PesoDisponible / 100)
    // Ejemplo: (40 - 35) / 0.5 = 10 (Necesito promedio 10 en lo que falta)
    let needed = (targetAvg - currentPoints) / (weightAvailableToFill / 100);

    // Ajustes finales
    needed = Math.ceil(needed); // Redondear hacia arriba (mejor que sobre a que falte)
    if (needed < 10) needed = 10; // Nota mínima es 10, no 1.0

    // Llamamos a la función que escribe EN TODOS LOS HUECOS
    applyNeededGrade(sIndex, needed, remainingWeight);
}

// Función auxiliar mejorada: Rellena TODOS los espacios disponibles
function applyNeededGrade(sIndex, needed, remainingWeightToAssign) {
    const card = document.getElementById(`details-${sIndex}`);
    const rowInputs = card.querySelectorAll('.grade-input');
    const weightInputs = card.querySelectorAll('.weight-input');
    
    let placed = false;
    let currentRemainingWeight = remainingWeightToAssign;

    subjects[sIndex].grades.forEach((g, idx) => {
        const inpGrade = rowInputs[idx];
        const inpWeight = weightInputs[idx];
        
        // Caso 1: Casilla tiene Peso pero no Nota
        if (g.weight && !g.value) {
            inpGrade.value = needed;
            inpGrade.classList.add('ghost-value');
            subjects[sIndex].grades[idx].value = needed.toString();
            placed = true;
        }
        
        // Caso 2: Casilla vacía total y nos falta asignar peso
        else if (!g.weight && !g.value && currentRemainingWeight > 0) {
            // Asignamos el peso restante aquí
            inpWeight.value = currentRemainingWeight;
            inpWeight.classList.add('ghost-value');
            subjects[sIndex].grades[idx].weight = currentRemainingWeight.toString();
            
            inpGrade.value = needed;
            inpGrade.classList.add('ghost-value');
            subjects[sIndex].grades[idx].value = needed.toString();
            
            currentRemainingWeight = 0; // Ya asignamos todo lo que faltaba
            placed = true;
        }
    });

    if (placed) {
        updateCalculations();
        
        // Mensajes inteligentes
        if (needed > 70) {
            alert(`Necesitas promedio ${needed} en lo que falta... \nMatemáticamente imposible (Máx 70) 💀`);
        } else if (needed === 10) {
             alert(`¡Relax! Te sirve sacar puros 10 (1.0) 😎`);
        }
    } else {
        alert("No hay filas vacías. Agrega una (+) para simular.");
    }
}

// --- AUTO-LIMPIEZA DE FANTASMAS 👻 ---
// Si haces clic en cualquier lugar que NO sea un input fantasma ni el menú mágico, los fantasmas desaparecen.
function handleGhostCleanup(e) {
    const ghosts = document.querySelectorAll('.ghost-value');
    if (ghosts.length === 0) return;

    if (e.target.classList.contains('ghost-value')) return;

    if (
        e.target.closest('button[onclick*="toggleMagicMenu"]') ||
        e.target.closest('div[id*="magic-menu-"]')
    ) return;

    const subjectsToClear = new Set();

    ghosts.forEach(input => {
        const parentDetails = input.closest('.subject-details');
        if (!parentDetails) return;

        const sIndex = parseInt(parentDetails.id.replace('details-', ''));
        if (!isNaN(sIndex)) subjectsToClear.add(sIndex);
    });

    subjectsToClear.forEach(clearGhosts);
}

function loadUnlockedThemes() {
    // 1. LEER LA MEMORIA
    let rawUnlocked = JSON.parse(localStorage.getItem('my_secret_themes') || '[]');

    // 🧹 2. LIMPIEZA AUTOMÁTICA (El paso clave)
    // Filtramos para dejar SOLO los temas que existen en SECRET_THEMES y quitamos duplicados
    const unlocked = [...new Set(rawUnlocked)].filter(themeKey => SECRET_THEMES[themeKey]);

    // 3. GUARDAR LA LISTA LIMPIA
    // Si había basura ('gold'), aquí se borra para siempre de la memoria
    if (unlocked.length !== rawUnlocked.length) {
        localStorage.setItem('my_secret_themes', JSON.stringify(unlocked));
    }

    if (unlocked.length === 0) return;

    const themeGrid = document.querySelector('#theme-modal .grid-cols-3');
    if (!themeGrid) return;

    // Calculamos cuántos tienes vs el total
    const totalSpecial = Object.keys(SECRET_THEMES).length;
    const currentCount = unlocked.length; // Ahora este número será REAL (ej: 9/9)

    // --- INSERTAR TÍTULO Y CONTADOR (Tu código original intacto) ---
    if (!document.getElementById('special-themes-title')) {
        const headerContainer = document.createElement('div');
        headerContainer.className = "flex justify-between items-end mb-2 mt-5 border-t border-gray-100 dark:border-gray-700 pt-4 animate-in fade-in slide-in-from-top-2";
        
        const title = document.createElement('span');
        title.id = 'special-themes-title';
        title.className = "text-[10px] font-bold text-primary-500 dark:text-primary-400 uppercase tracking-wider";
        title.innerText = "✨ Desbloqueado en Gacha";
        
        const counter = document.createElement('span');
        counter.id = 'special-themes-counter';
        counter.className = "text-[10px] font-mono font-bold text-gray-400";
        counter.innerText = `COLECCIÓN: ${currentCount}/${totalSpecial}`;

        headerContainer.appendChild(title);
        headerContainer.appendChild(counter);
        themeGrid.parentNode.insertBefore(headerContainer, themeGrid.nextSibling); 
        
        const specialGrid = document.createElement('div');
        specialGrid.id = 'special-themes-grid';
        specialGrid.className = "grid grid-cols-3 gap-2 mt-2";
        headerContainer.parentNode.insertBefore(specialGrid, headerContainer.nextSibling);
    } else {
        const counter = document.getElementById('special-themes-counter');
        if (counter) counter.innerText = `COLECCIÓN: ${currentCount}/${totalSpecial}`;
    }

    const specialGrid = document.getElementById('special-themes-grid');

    // --- GENERAR BOTONES (Con protección extra) ---
    unlocked.forEach(themeKey => {
        // Evitar duplicar botones visualmente
        if (document.getElementById(`btn-theme-${themeKey}`)) return;

        // Recuperar datos
        const data = SECRET_THEMES[themeKey];
        
        // 🛡️ SEGURIDAD EXTRA: Si por milagro sigue habiendo un fantasma, lo ignoramos
        if (!data) return; 

        const btn = document.createElement('button');
        btn.id = `btn-theme-${themeKey}`;
        btn.onclick = () => setTheme(themeKey);

        // ESTILO EN LÍNEA PARA EL BOTÓN
        btn.style.setProperty('border', `2px solid ${data.color}`, 'important');
        btn.style.setProperty('background-color', data.bg, 'important');
        btn.style.setProperty('box-shadow', `0 0 8px ${data.color}66`, 'important');

        btn.className = "h-8 w-full rounded-md transition-all animate-in zoom-in duration-500 relative group";

        btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 opacity-80 group-hover:opacity-100 group-hover:scale-125 transition-all" viewBox="0 0 24 24" fill="${data.color}">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
        `;

        specialGrid.appendChild(btn);
    });
}

// 2. Función para desbloquear un tema nuevo
function unlockNewTheme(themeKey) {
    let unlocked = JSON.parse(localStorage.getItem('my_secret_themes') || '[]');
    
    if (!unlocked.includes(themeKey)) {
        unlocked.push(themeKey);
        localStorage.setItem('my_secret_themes', JSON.stringify(unlocked));
        
        // Recargamos los botones para que aparezca el nuevo
        loadUnlockedThemes();
        
        return true; // Es nuevo
    }
    return false; // Ya lo tenía
}

// IMPORTANTE: Agregar esto al inicio de tu función "loadData" o "window.onload"
// para que cargue los botones cuando abras la página.
setTimeout(loadUnlockedThemes, 500);

/**
 * Lógica de Exportación a Imagen (Versión Minimalista - Sin Cajas Grises)
 */
async function exportAsImage() {
    const btnExport = document.querySelector('button[onclick="exportAsImage()"]');
    const originalBtnText = btnExport ? btnExport.innerHTML : 'Descargar';
    
    if(btnExport) {
        btnExport.disabled = true;
        btnExport.innerHTML = `Generando...`;
    }

    try {
        const ghost = document.createElement('div');
        ghost.id = "ghost-export-container";
        
        // Estilos base
        ghost.style.cssText = `
            position: fixed;
            left: -9999px;
            top: 0;
            width: 800px;
            background-color: #f3f4f6; /* Fondo Gris Suave */
            font-family: 'Inter', system-ui, sans-serif !important;
            padding: 60px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 20px;
            z-index: -9999;
            color: #111827;
        `;

        const semText = document.getElementById('sem-rounded').textContent;
        const pgaValue = parseFloat(semText.replace(',','.'));
        const pgaColor = pgaValue < 40 ? '#dc2626' : '#111827'; 
        const dateStr = new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });

        let cardsHtml = '';
        subjects.forEach(sub => {
            const avgRaw = calculateSubjectAvg(sub);
            const avgRounded = avgRaw > 0 ? roundGrade(avgRaw) : '-';
            const isFailing = avgRaw > 0 && avgRounded < 40;
            const barColor = avgRaw === 0 ? '#9ca3af' : (isFailing ? '#dc2626' : '#2563eb');
            
            // Notas individuales (DISEÑO LIMPIO, SIN BURBUJAS)
            const gradesHtml = sub.grades
                .filter(g => g.value !== "")
                .map(g => {
                    const val = parseFloat(g.value);
                    const color = val < 40 ? '#dc2626' : '#111827';
                    return `
                        <div style="display:flex; flex-direction:column; align-items:center; margin-right: 20px;">
                            <span style="font-size:28px; font-weight:800; color:${color} !important; font-family: 'Inter', sans-serif !important; line-height: 1;">${g.value}</span>
                            <span style="font-size:13px; font-weight:600; color:#4b5563 !important; margin-top:4px; font-family: 'Inter', sans-serif !important;">${g.weight}%</span>
                        </div>
                    `;
                }).join('') || 
                '<span style="color:#9ca3af !important; font-size:14px !important; font-style:italic !important; padding: 5px;">Sin notas</span>';

            cardsHtml += `
                <div style="
                    background: white;
                    border: 3px solid ${barColor}; /* Borde completo de color */
                    padding: 24px 30px;
                    border-radius: 20px; /* Bordes bien redondos */
                    box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.05); /* Sombra flotante */
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <div style="flex:1;">
                        <div style="margin:0 0 12px 0; font-size:24px; font-weight:800; color:#1f2937 !important; font-family: 'Inter', sans-serif !important;">
                            ${sub.name}
                        </div>
                        <div style="display:flex; flex-wrap:wrap; align-items: center;">${gradesHtml}</div>
                    </div>
                    
                    <div style="text-align: center; padding-left: 15px;">
                        <div style="font-size:52px; font-weight:900; color:${barColor} !important; font-family: 'Inter', sans-serif !important; line-height: 1;">
                            ${avgRounded}
                        </div>
                        <div style="font-size: 11px; font-weight: 700; color: #9ca3af; margin-top: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Inter', sans-serif !important;">
                            Promedio
                        </div>
                    </div>
                </div>
            `;
        });

        // INYECTAR HTML
        ghost.innerHTML = `
            <div style="
                display:flex; 
                justify-content:space-between; 
                align-items:flex-end; 
                border-bottom: 2px solid #e5e7eb; 
                padding-bottom: 30px; 
                margin-bottom: 15px;
            ">
                
                <div style="flex: 1;">
                    <img src="IMG/calcula-mis-ramos-descarga.png" alt="Mis Ramos" style="height: 70px; width: auto; display: block; object-fit: contain;">
                </div>
                
                <div style="text-align:right;">
                    <span style="
                        display:block; 
                        font-size:14px; 
                        font-weight:800; 
                        color:#2563eb !important; 
                        letter-spacing:1px; 
                        margin-bottom: -15px; /* Pegado al número */
                        line-height: 0.5;
                        font-family: 'Inter', sans-serif !important;
                    ">
                        PROMEDIO FINAL
                    </span>
                    <span style="
                        font-size: 60px; /* Un poco más pequeño para armonía */
                        font-weight: 700; 
                        color:${pgaColor} !important; 
                        line-height: 1.5; /* Altura de línea compacta */
                        display:block; 
                        margin-top: -15px;
                        font-family: 'Inter', sans-serif !important;
                        padding-right: 25px;
                    ">
                        ${semText}
                    </span>
                </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:20px; flex:1;">
                ${cardsHtml}
            </div>

            <div style="display:flex; justify-content:space-between; border-top:2px dashed #d1d5db; padding-top:30px; margin-top:20px; align-items:center;">
                <span style="color:#1f2937 !important; font-weight:700; font-size:16px; font-family: 'Inter', sans-serif !important;">misramos.cl</span>
                <span style="color:#4b5563 !important; font-weight:500; font-size:14px; font-family: 'Inter', sans-serif !important;">Generado el ${dateStr}</span>
            </div>
        `;

        document.body.appendChild(ghost);

        await new Promise(r => setTimeout(r, 200)); 

        const canvas = await html2canvas(ghost, {
            scale: 2, 
            backgroundColor: "#f3f4f6",
            logging: false,
            useCORS: true, 
            windowWidth: 1200,
            onclone: (clonedDoc) => {
                clonedDoc.documentElement.className = '';
                clonedDoc.body.className = '';
            }
        });

        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `MisRamos_${Date.now()}.png`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                document.body.removeChild(ghost);
                if(btnExport) {
                    btnExport.disabled = false;
                    btnExport.innerHTML = originalBtnText;
                }
            }, 1000);
        }, 'image/png');

    } catch (err) {
        console.error("Error:", err);
        alert("Error al generar imagen.");
        const ghost = document.getElementById("ghost-export-container");
        if(ghost) document.body.removeChild(ghost);
        if(btnExport) {
            btnExport.disabled = false;
            btnExport.innerHTML = originalBtnText;
        }
    }
}


// Función para cerrar el menú mágico si haces clic fuera
function handleMagicMenuClose(e) {
    // Si clicamos en el menú o el botón, no hacemos nada
    if (e.target.closest('div[id*="magic-menu-"]') || e.target.closest('button[onclick*="toggleMagicMenu"]')) {
        return;
    }

    // Si clicamos fuera, cerramos todos los menús
    const allMenus = document.querySelectorAll('div[id*="magic-menu-"]');
    allMenus.forEach(menu => {
        if (!menu.classList.contains('hidden')) {
            menu.classList.add('hidden');
            // Restauramos el orden de las capas
            const parentCard = menu.closest('#subjects-grid > div');
            if (parentCard) {
                parentCard.style.zIndex = "1";
                parentCard.style.position = "relative";
            }
        }
    });
}

document.addEventListener('click', function (e) {
    handleMagicMenuClose(e);
    handleGhostCleanup(e);
});

// --- FUNCIÓN DE ALERTA (TOAST) ---
function showToast(message, type = 'success') {
    // 1. Crear el elemento
    const toast = document.createElement('div');
    
    // 2. Definir colores según tipo
    const bgColor = type === 'warning' ? 'bg-amber-500' : 'bg-primary-600';
    
    // 3. Aplicar clases de Tailwind
    toast.className = `fixed bottom-4 right-4 px-4 py-3 rounded-xl shadow-2xl text-white text-sm font-bold z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 ${bgColor} flex items-center gap-2`;
    
    // 4. Poner el mensaje
    toast.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>${message}</span>
    `;
    
    // 5. Agregar al cuerpo
    document.body.appendChild(toast);
    
    // 6. Eliminar automáticamente después de 3 segundos
    setTimeout(() => {
        toast.classList.add('opacity-0', 'transition-opacity', 'duration-500');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

window.onload = loadData;

