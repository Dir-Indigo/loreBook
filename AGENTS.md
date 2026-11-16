# AGENTS.md

## Objetivo principal

Este repositorio contiene una aplicación funcional cuyo comportamiento actual debe preservarse.

La prioridad absoluta al trabajar en este proyecto es:

1. No afectar funcionalidades existentes.
2. No modificar código fuera del alcance solicitado.
3. No corregir malas prácticas de forma incidental.
4. No realizar refactorizaciones preventivas.
5. No cambiar arquitectura, dependencias o estructura sin autorización explícita.
6. Implementar siempre el cambio mínimo necesario.

Este proyecto puede contener deuda técnica, código duplicado, nombres poco claros, acoplamiento, lógica extensa, falta de tipado, validaciones incompletas u otras malas prácticas.

Estas condiciones deben considerarse parte del estado actual del sistema y no deben corregirse salvo que la tarea lo solicite explícitamente.

---

## Estado actual del proyecto

Actualmente, el proyecto presenta las siguientes condiciones:

* No existe una suite de pruebas automatizadas confiable.
* Puede no existir documentación técnica o funcional.
* Algunas partes del código contienen malas prácticas.
* Puede existir lógica con dependencias implícitas.
* Algunos comportamientos pueden depender de efectos secundarios no documentados.
* Puede existir código aparentemente innecesario que en realidad participa en algún flujo.
* El sistema funciona actualmente y se prefiere preservar ese estado antes que mejorar su diseño.

---

## Regla general de trabajo

Antes de modificar cualquier archivo:

1. Inspecciona el código relacionado con la tarea.
2. Identifica quién invoca el código que será modificado.
3. Identifica dependencias directas e indirectas.
4. Revisa configuraciones, variables de entorno y archivos relacionados.
5. Determina cuál es el cambio mínimo que resuelve la solicitud.
6. Evita extender el alcance hacia mejoras no solicitadas.

No modifiques archivos hasta comprender razonablemente el flujo afectado.

Cuando no exista suficiente información para garantizar la seguridad de un cambio, debes:

* limitar el cambio al mínimo posible;
* conservar la estructura existente;
* conservar contratos, nombres y formatos;
* indicar claramente los riesgos o elementos que no pudieron validarse.

---

## Malas prácticas existentes

El proyecto puede contener malas prácticas conocidas o evidentes.

No debes corregirlas salvo que exista una instrucción explícita para hacerlo.

Esto incluye, entre otros:

* funciones o métodos demasiado extensos;
* clases con múltiples responsabilidades;
* código duplicado;
* nombres poco descriptivos;
* valores fijos dentro del código;
* lógica de negocio en controladores;
* acceso directo a base de datos desde capas no ideales;
* uso excesivo de variables globales;
* ausencia de tipos;
* uso de tipos genéricos o inseguros;
* manejo inconsistente de errores;
* comentarios desactualizados;
* validaciones incompletas;
* dependencias fuertemente acopladas;
* archivos con muchas responsabilidades;
* consultas poco optimizadas;
* convenciones inconsistentes;
* código muerto o aparentemente no utilizado;
* dependencias antiguas;
* configuraciones no estandarizadas.

No asumas que una mala práctica puede eliminarse sin consecuencias.

Si una nueva funcionalidad debe integrarse cerca de código con malas prácticas, sigue el patrón existente cuando cambiarlo implique un riesgo para el funcionamiento actual.

Solo introduce una mejora estructural cuando sea indispensable para completar la tarea y no exista una alternativa más localizada.

---

## Excepción: rediseño visual (UI/UX)

Cuando el usuario solicite explícitamente un rediseño o mejora visual (UI/UX), las reglas de "cambio mínimo", "no reformatear", "no refactorizar" y "respetar el estilo existente" NO aplican a la capa de presentación.

Se permite, dentro del alcance visual solicitado:

* reescribir CSS y estilos de componentes;
* modificar el markup/JSX de presentación y el layout;
* actualizar el tema, variables de diseño, tipografía e iconografía;
* centralizar estilos compartidos en tokens/variables;
* reemplazar estilos antiguos que estorben, en lugar de solo retocarlos.

Siguen intocables, incluso durante un rediseño:

* lógica de negocio, cálculos y reglas comerciales;
* endpoints, contratos de API y estructuras de datos;
* nombres de campos, props y eventos que usa la lógica;
* rutas, permisos y autenticación;
* base de datos, variables de entorno y dependencias (no agregar librerías de diseño nuevas).

Reglas del proceso de rediseño:

* trabajar por etapas y detenerse al final de cada una para esperar aprobación explícita;
* ser ambicioso dentro del alcance de la etapa: la diferencia visual debe ser evidente, no sutil;
* mantener la identidad de marca (amarillo SER como acento, tonos oscuros y neutros, logotipos existentes);
* las demás reglas de este documento (Git, seguridad, archivos generados, informe final) siguen vigentes.

---

## Refactorizaciones

No realices refactorizaciones salvo que el usuario las solicite explícitamente.

Se consideran refactorizaciones no autorizadas:

* renombrar clases, funciones, variables o archivos;
* mover archivos entre carpetas;
* extraer funciones o clases;
* dividir archivos;
* fusionar módulos;
* cambiar patrones de diseño;
* reorganizar imports;
* reemplazar callbacks por promesas o viceversa;
* cambiar programación síncrona por asíncrona;
* sustituir consultas existentes;
* cambiar el flujo de errores;
* modificar estructuras de respuesta;
* cambiar librerías;
* actualizar dependencias;
* eliminar código duplicado;
* convertir código heredado a una implementación moderna;
* aplicar formato a archivos completos;
* reescribir código que ya funciona.

Si la tarea requiere modificar una función existente, cambia únicamente las líneas necesarias.

No reformatees el resto del archivo.

---

## Ausencia de documentación

El proyecto puede no contar con documentación técnica, funcional o de arquitectura.

No debes crear documentación extensa sin autorización.

Para comprender el sistema, utiliza como fuente principal:

* el código existente;
* archivos de configuración;
* scripts;
* variables de entorno de ejemplo;
* definiciones de rutas;
* controladores;
* servicios;
* modelos;
* consultas;
* archivos de despliegue;
* historial visible dentro del repositorio, cuando esté disponible.

No inventes comportamientos ni decisiones arquitectónicas.

Si algo no puede deducirse razonablemente del código, indícalo como desconocido.

No presentes suposiciones como hechos.

---

## Comportamiento existente

El comportamiento actual tiene prioridad sobre la consistencia técnica.

Debes preservar:

* formatos de entrada;
* formatos de salida;
* nombres de propiedades;
* códigos de estado;
* mensajes de error;
* nombres de eventos;
* rutas;
* parámetros;
* valores por defecto;
* secuencia de operaciones;
* efectos secundarios;
* compatibilidad con consumidores actuales;
* contratos internos y externos;
* comportamiento ante valores nulos o vacíos;
* comportamiento aparentemente incorrecto que otros componentes puedan estar esperando.

No “corrijas” un comportamiento extraño sin confirmar que se trata de un defecto solicitado.

Un comportamiento técnicamente incorrecto puede formar parte de un contrato existente.

---

## Compatibilidad

Mantén compatibilidad con:

* la versión actual del lenguaje;
* la versión actual del framework;
* las dependencias instaladas;
* la base de datos existente;
* las integraciones externas;
* los scripts existentes;

No actualices versiones ni dependencias salvo autorización explícita.

No cambies APIs públicas o internas sin revisar sus consumidores.

No cambies tipos de datos, estructuras o nombres utilizados en otros módulos.

---

## Dependencias

No agregues, elimines ni actualices dependencias salvo que sea estrictamente necesario y exista autorización explícita.

Antes de proponer una dependencia nueva:

1. Verifica si el proyecto ya contiene una utilidad equivalente.
2. Evalúa si puede resolverse con el lenguaje o framework existente.
3. Considera el impacto en compilación y despliegue.
4. Explica claramente por qué es necesaria.

No reemplaces una dependencia existente únicamente porque exista una alternativa más moderna.

---

## Base de datos

Trabaja de forma conservadora con la base de datos.

Está prohibido:

* eliminar tablas;
* eliminar columnas;
* renombrar columnas existentes;
* cambiar tipos de datos de manera incompatible;
* modificar datos masivamente sin autorización;
* ejecutar operaciones destructivas;
* editar migraciones históricas ya aplicadas;
* alterar restricciones existentes sin analizar su impacto;
* cambiar consultas fuera del alcance solicitado.

Si se requiere una modificación de esquema:

* crea una nueva migración cuando el proyecto use migraciones;
* preserva compatibilidad cuando sea posible;
* evita eliminar información;
* indica riesgos de despliegue;
* no ejecutes la migración en entornos externos.

No uses datos reales sensibles en ejemplos o pruebas.

---

## Variables de entorno y configuración

No modifiques variables de entorno existentes de manera incompatible.

No elimines variables aunque parezcan no utilizadas.

No cambies nombres de variables sin revisar todos sus consumidores.

Si necesitas agregar una variable:

* utiliza el patrón existente;
* agrega un valor de ejemplo seguro cuando exista un archivo de ejemplo;
* no escribas secretos reales;
* documenta brevemente su finalidad;
* conserva un comportamiento por defecto cuando sea seguro hacerlo.

No leas, muestres ni expongas contenido sensible de archivos `.env`.

---

## Seguridad

No introduzcas cambios que reduzcan la seguridad existente.

Está prohibido:

* desactivar autenticación;
* omitir autorización;
* desactivar validaciones;
* aceptar certificados inseguros de forma global;
* registrar tokens o contraseñas;
* agregar claves al repositorio;
* exponer datos sensibles;
* devolver errores internos completos al usuario final;
* modificar permisos para resolver errores sin evaluar su impacto.

Si una tarea parece requerir debilitar controles de seguridad, detente e indica el riesgo.

---

## Archivos generados

No modifiques archivos generados automáticamente salvo que el proyecto requiera explícitamente que sean versionados.

Ejemplos:

* archivos compilados;
* carpetas de distribución;
* clientes generados;
* código generado desde esquemas;
* archivos de cobertura;
* archivos temporales;
* archivos de caché;
* dependencias instaladas.

Modifica siempre la fuente original cuando sea posible.

---

## Estilo de código

Respeta el estilo existente en el archivo modificado, incluso cuando sea inconsistente con otros archivos.

No formatees archivos completos.

No cambies comillas, espacios, saltos de línea, imports o nombres fuera de las líneas necesarias.

No ejecutes herramientas de formato global que produzcan cambios masivos.

Cuando exista un formateador configurado, úsalo únicamente si no modifica archivos ajenos a la tarea.

---

## Git

No ejecutes acciones destructivas de Git.

Está prohibido:

* hacer `push`;
* hacer `force push`;
* ejecutar `git reset --hard`;
* ejecutar `git clean` sobre archivos del usuario;
* hacer `rebase`;
* modificar commits existentes;
* eliminar ramas;
* descartar cambios no relacionados;
* sobrescribir trabajo local;
* hacer commits sin solicitud explícita.

Antes de finalizar:

* revisa los archivos modificados;
* confirma que no existan cambios accidentales;
* evita incluir archivos no relacionados;
* resume qué archivos fueron cambiados.

No reviertas cambios previos del usuario aunque parezcan incorrectos.

---

## Proceso recomendado para cada tarea

### 1. Analizar

Antes de implementar:

* localiza el flujo afectado;
* revisa sus llamadas y dependencias;
* identifica entradas y salidas;
* revisa usos del componente;
* busca configuraciones relacionadas;
* identifica riesgos de compatibilidad.

### 2. Definir el cambio mínimo

Selecciona la solución con menor impacto.

Prefiere:

* modificar una condición concreta;
* agregar una validación localizada;
* extender una función existente;
* reutilizar utilidades actuales;
* conservar contratos existentes;
* evitar cambios estructurales.

### 3. Implementar

Durante la implementación:

* modifica únicamente archivos necesarios;
* conserva patrones existentes;
* evita refactorizaciones;
* evita renombrados;
* no reformatees código no relacionado;
* no agregues dependencias innecesarias;
* no cambies comportamientos ajenos.

### 4. Informar

Al finalizar, indica:

* qué se modificó;
* qué archivos se cambiaron;
* qué comportamiento se preservó;
* qué validaciones se ejecutaron;
* qué validaciones no pudieron ejecutarse;
* qué riesgos permanecen;
* si existen supuestos no confirmados.

---

## Manejo de errores existentes

No modifiques el manejo de errores global salvo solicitud explícita.

No cambies mensajes de error existentes sin necesidad.

No reemplaces silenciosamente excepciones, códigos o respuestas.

Si debes agregar un nuevo error:

* sigue el patrón actual;
* conserva el formato existente;
* no expongas información sensible;
* evita introducir una estrategia global nueva.

---

## Logs

No elimines logs existentes salvo solicitud explícita.

No agregues logs con información sensible.

Evita registrar:

* contraseñas;
* tokens;
* secretos;
* datos personales;
* contenido completo de solicitudes sensibles;
* credenciales;
* cadenas de conexión.

Si agregas logs para diagnosticar una tarea, considera eliminarlos antes de finalizar, salvo que sean necesarios de forma permanente.

---

## Análisis sin modificación

Cuando la tarea solicite análisis, revisión, diagnóstico o propuesta:

* no modifiques archivos;
* no instales dependencias;
* no ejecutes migraciones;
* no apliques correcciones;
* presenta hallazgos y riesgos;
* separa hechos comprobados de hipótesis.

Solo modifica el proyecto cuando exista una instrucción explícita de implementación.

---

## Instrucciones para tareas ambiguas

Cuando una tarea tenga múltiples interpretaciones:

* elige la alternativa de menor impacto;
* conserva el comportamiento existente;
* evita cambios estructurales;
* documenta el supuesto realizado;
* no amplíes el alcance.

Si una decisión puede afectar contratos, datos, seguridad o despliegue, no asumas que una mejora técnica está autorizada.

---

## Definición de terminado

Una tarea se considera terminada cuando:

* se implementó únicamente el alcance solicitado;
* el cambio es lo más pequeño posible;
* no se realizaron refactorizaciones no autorizadas;
* no se corrigieron malas prácticas no relacionadas;
* no se cambiaron contratos existentes innecesariamente;
* no se agregaron dependencias sin autorización;
* no se modificaron archivos ajenos;
* se ejecutaron las validaciones disponibles;
* se reportaron las validaciones que no pudieron ejecutarse;
* se explicaron claramente los riesgos o supuestos pendientes.

La ausencia de pruebas automatizadas significa que no puede garantizarse la inexistencia total de regresiones.

Nunca afirmes que el cambio es completamente seguro si no existen mecanismos suficientes para comprobarlo.

---

## Formato de respuesta esperado

Después de una modificación, utiliza una respuesta similar a esta:

### Cambios realizados

* Descripción breve del cambio.
* Motivo de la implementación seleccionada.
* Comportamiento que se mantuvo sin cambios.

### Archivos modificados

* `ruta/al/archivo`: descripción del cambio.

### Validaciones no disponibles

* No existen pruebas automatizadas.
* No fue posible verificar determinados flujos externos.
* No existe documentación funcional para confirmar ciertos comportamientos.

### Riesgos o consideraciones

* Riesgos conocidos.
* Supuestos realizados.
* Elementos que requieren validación manual.

---

## Instrucción final

En este proyecto, preservar el funcionamiento actual es más importante que mejorar la calidad técnica.

Comprende primero.

Modifica lo mínimo.

No refactorices.

No corrijas malas prácticas no solicitadas.

No asumas que un código extraño es innecesario.

No declares una validación que no realizaste.

Reporta con claridad cualquier riesgo o limitación.

No hagas validaciones o pruebas luego de realizar cambios
