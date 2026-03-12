2. Primer contacto con Cursor

    Instala Cursor y abre el proyecto TaskFlow
    Explora la interfaz: explorador de archivos, terminal integrada, chat y herramientas de edición
    Prueba el autocompletado escribiendo comentarios que describan funciones
    Utiliza el chat contextual para pedir explicaciones de partes del código
    Utiliza la edición inline para modificar funciones existentes
    Prueba Composer para generar cambios que afecten a varios archivos
    Anota en docs/ai/cursor-workflow.md los atajos de teclado que uses con más frecuencia
    Documenta dos ejemplos concretos donde Cursor haya mejorado tu código

   Dos ejemplos donde Cursor mejorò mi còdigo:
   -> "Extraia a lógica inline de JavaScript dos atributos 'onchange' e 'onclick' destes elementos para uma nova função chamada toggleNewCategoryInput. Limpe o HTML para que ele apenas chame essa função. Adicione a função no script principal lidando com a visibilidade de 'newCategorySelect' e 'newCategoryText'."
   Vou localizar o JavaScript inline em index.html, criar a função toggleNewCategoryInput no script principal e limpar os atributos dos elementos para usarem apenas essa função. Depois verifico se tudo ficou consistente.

   class="w-full rounded-md border border-amber-900/40 dark:border-amber-600/60 bg-amber-50/60 dark:bg-zinc-900/80 px-3 py-3 text-sm text-[#6b7280] dark:text-amber-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70 transition cursor-pointer"
                onchange="toggleNewCategoryInput()">
              </select>
              <input type="text" id="newCategoryText" data-i18n-placeholder="newCategoryPlaceholder" placeholder="Nueva categoría..."
                class="w-full hidden rounded-md border border-amber-900/40 dark:border-amber-600/60 bg-amber-50/60 dark:bg-zinc-900/80 px-3 py-3 text-sm text-[#6b7280] dark:text-amber-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70 transition">

 toggleNewCategoryInput() {
      const selectEl = document.getElementById('newCategorySelect');
      const textEl = document.getElementById('newCategoryText');
      const cancelBtn = document.getElementById('cancelNewCatBtn');
      const evtTarget = (typeof event !== 'undefined') ? event.target : null;

      if (!selectEl || !textEl || !cancelBtn) return;

      const fromSelect = evtTarget === selectEl;
      const fromCancel = evtTarget === cancelBtn;

      if (fromSelect && selectEl.value === 'nueva') {
        selectEl.classList.add('hidden');
        textEl.classList.remove('hidden');
        cancelBtn.classList.remove('hidden');
        textEl.focus();
      } else if (fromCancel) {
        textEl.classList.add('hidden');
        textEl.value = '';
        selectEl.classList.remove('hidden');
        selectEl.selectedIndex = 0;
        cancelBtn.classList.add('hidden');
      }
    }


 class="w-full rounded-md border border-amber-900/40 dark:border-amber-600/60 bg-amber-50/60 dark:bg-zinc-900/80 px-3 py-3 text-sm text-[#6b7280] dark:text-amber-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/70 transition cursor-pointer"
                onchange="organizator.toggleNewCategoryInput()">
              </select>

              <button type="button" id="cancelNewCatBtn"
                onclick="organizator.toggleNewCategoryInput()"
                class="absolute right-2 text-red-500 font-bold hidden hover:scale-110">✕</button>

    O que foi feito
HTML limpo:

select#newCategorySelect agora usa apenas onchange="organizator.toggleNewCategoryInput()".
button#cancelNewCatBtn agora usa apenas onclick="organizator.toggleNewCategoryInput()".
Nova função no script principal: Dentro da classe Organizator foi adicionada a função toggleNewCategoryInput(), que:

Mostra newCategoryText, esconde newCategorySelect e exibe o botão de cancelar quando o select muda para o valor 'nueva'.
Ao clicar no botão cancelar, esconde newCategoryText, limpa o valor, volta a mostrar newCategorySelect, reseta o selectedIndex para 0 e esconde o botão de cancelar.

-> "Refatore este event listener anônimo transformando-o em uma função nomeada chamada handleOutsideClickForLangDropdown. Separe a declaração da função do addEventListener para deixar o código mais limpo e fácil de manter."
<script>
    function handleOutsideClickForLangDropdown(e) {
      const w = document.getElementById('langWidget');
      if (w && !w.contains(e.target)) {
        document.getElementById('langDropdown')?.classList.remove('open');
      }
    }
    document.addEventListener('click', handleOutsideClickForLangDropdown);
  </script>

  ATAJOS MÁS USADO

  crtl + K
  crtl + shift + Y
  tab
  crtl + shift + P
  crtl + I



  
  

  