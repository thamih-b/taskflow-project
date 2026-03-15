2. Primer contacto con Cursor

    Instala Cursor y abre el proyecto TaskFlow
    Explora la interfaz: explorador de archivos, terminal integrada, chat y herramientas de edición
    Prueba el autocompletado escribiendo comentarios que describan funciones
    Utiliza el chat contextual para pedir explicaciones de partes del código
    Utiliza la edición inline para modificar funciones existentes
    Prueba Composer para generar cambios que afecten a varios archivos
    Anota en docs/ai/cursor-workflow.md los atajos de teclado que uses con más frecuencia
    Documenta dos ejemplos concretos donde Cursor haya mejorado tu código

3. Refactorizar TaskFlow usando IA

    Revisa todo el código de TaskFlow y detecta partes mejorables
    Usa IA para refactorizar al menos cinco funciones
    Mejora nombres de variables y estructura de archivos
    Añade validaciones adicionales al formulario
    Simplifica funciones largas o repetitivas
    Añade comentarios JSDoc en varias funciones del proyecto
    Revisa manualmente todo el código generado antes de aceptarlo
    Realiza commits claros explicando cada mejora

4. Conectar servidores MCP

    Investiga qué es el Model Context Protocol
    Busca cómo configurar MCP dentro de Cursor
    Instala un servidor MCP (por ejemplo filesystem o GitHub)
    Comprueba que funciona pidiendo a la IA que acceda a información del proyecto
    Realiza al menos cinco consultas distintas utilizando el servidor MCP
    Documenta el proceso de instalación paso a paso
    Explica en qué casos puede ser útil MCP en proyectos reales


####----------------------------- Dos ejemplos donde Cursor mejoró mi código -----------------------------####


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

####-----------------------------   ATAJOS MÁS USADO -----------------------------####



  crtl + K
  crtl + shift + Y
  tab
  crtl + shift + P
  crtl + I

####----------------------------- INSTALACIÓN MCP  -----------------------------####
Para esta prueba, he decidido instalar el servidor MCP filesystem, que permite a la IA de Cursor salir de su entorno aislado y leer/escribir archivos en directorios específicos de mi ordenador de forma segura.

Pasos que he seguido:

    Requisitos previos: Me aseguré de tener Node.js y npm instalados en mi equipo, ya que los servidores MCP locales suelen ejecutarse vía npx.

    Acceso a la configuración: Dentro de Cursor, abrí la configuración general (haciendo clic en el icono del engranaje ⚙️) y busqué la sección Features > MCP.

    Añadir el servidor: Hice clic en el botón + Add New MCP Server.

    Configuración del formulario:

        Name: sistema-archivos-local

        Type: command

        Command: Escribí el comando de ejecución indicando la ruta de mi proyecto. En mi caso:
        npx -y @modelcontextprotocol/server-filesystem C:\Users\Alumno\Proyectos\Organizador_de_tareas

    Guardar y verificar: Hice clic en "Save". Tras unos segundos, apareció un punto verde al lado del nombre del servidor, confirmando que Cursor se había conectado correctamente al protocolo.

2. Comprobación de funcionamiento

Para comprobar que funcionaba, abrí el chat de Cursor (Ctrl + L) y le pedí explícitamente:

    "Usando tus herramientas MCP, dime qué carpetas y archivos hay en el directorio raíz de mi proyecto Organizador_de_tareas".

La IA activó automáticamente la herramienta list_directory proporcionada por el servidor MCP y me devolvió la lista exacta de mis ficheros (index.html, app.js, styles.css, etc.), demostrando que ya tenía acceso real a la información de mi disco duro sin que yo tuviera que pegarle el código.
3. Cinco consultas distintas utilizando el servidor MCP

Una vez confirmada la conexión, realicé 5 pruebas (prompts) diferentes para exprimir las capacidades de este servidor MCP:

Exploración de directorios:

    Mi consulta: "Lista todos los archivos que hay en la raíz del proyecto y confirma si los archivos que separamos en el refactor (app.js, styles.css, i18n.js) ya están ahí."

    Resultado: La IA usó la herramienta list_directory y me mapeó la estructura, confirmando que en mi carpeta principal están index.html, app.js, styles.css e i18n.js listos para usarse.

Lectura de contenido específico:

    Mi consulta: "Lee el contenido exacto del archivo app.js (o el script de mi clase Organizator) y dime cuántos métodos/funciones tengo declarados en él, listando un par de ejemplos."

    Resultado: Usó la función read_file, analizó el código fuente y me respondió que encontró aproximadamente 38 métodos/funciones en la lógica principal, listándome ejemplos reales de mi código como generateTaskHTML(), deleteSubtask() y toggleSubtaskPanel().

Búsqueda de dependencias/cadenas de texto:

    Mi consulta: "Busca en el código de mis archivos cuántas veces estoy usando la clase dark: de Tailwind para el modo oscuro."

    Resultado: La IA utilizó search_files (o herramientas de lectura en bloque) y me confirmó que, gracias a mi configuración de Tailwind, estoy aplicando clases responsivas de dark: 128 veces a lo largo del HTML (como en dark:bg-zinc-900 o dark:text-zinc-100).

Obtención de metadatos:

    Mi consulta: "Dame la información (metadatos) del archivo principal de la interfaz (index.html o el equivalente donde está todo unificado). Quiero saber su tamaño y cuándo fue la última vez que se modificó."

    Resultado: Ejecutó la herramienta get_file_info y me devolvió que mi archivo principal pesa alrededor de 49 KB (unos 49.015 bytes) y me dio la fecha exacta de mi última sesión de guardado en el ordenador.

Creación/Escritura de archivos:

    Mi consulta: "Crea un nuevo archivo llamado resumen_mcp.md en la raíz del proyecto y escribe en él un pequeño resumen destacando que la clase Organizator tiene soporte multilenguaje (es, pt, en)."

    Resultado: La IA no me dio el código para copiar, sino que usó la herramienta write_file del MCP y creó el archivo físicamente en mi carpeta al instante, incluyendo el texto que le pedí sobre las traducciones.

####----------------------------- CASOS DE USO PARA MCP  -----------------------------####
me he dado cuenta de que MCP tiene un potencial enorme para resolver problemas del día a día:

    Conexión a Bases de Datos de la empresa: En lugar de tener que salir de Cursor, abrir DBeaver/DataGrip, hacer una consulta SQL, copiar el resultado y dárselo a la IA para que entienda la estructura de datos, podríamos instalar un servidor MCP de PostgreSQL o SQLite. La IA podría consultar el esquema de la base de datos en tiempo real y escribir código Backend exacto a la primera.

    Integración con GitHub/GitLab: Con un MCP de GitHub, si me asignan un ticket con un bug, puedo pedirle a Cursor: "Lee la Issue #45 del repositorio de la empresa, busca en el código dónde está fallando y proponme la solución".

    Documentación interna (Confluence/Notion): En proyectos grandes de prácticas me cuesta encontrar cómo funcionan las APIs internas. Un MCP conectado al Notion o Swagger de la empresa permitiría a la IA leer la documentación privada y ayudarme a programar endpoints sin tener que estar buscando PDFs manuales.

    Logs y Debugging en la Nube: Si la aplicación falla en producción (AWS o Sentry), un MCP podría permitir al editor leer los logs de errores recientes y cruzar esa información directamente con mi código local para encontrar el fallo al momento.

En resumen, MCP transforma a la IA de ser un simple "chat de ayuda" a convertirse en un compañero de trabajo que tiene acceso seguro a las mismas herramientas y entornos que uso yo en mi puesto.