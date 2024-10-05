# IdxDB

**IdxDB** es una ... <!-- TODO -->

## Características

- <!-- TODO -->

## Instalación

Puedes instalar el paquete a través de npm:

```bash
npm install idxdb
```

## Uso

### Crear una instancia de IdxDB

```javascript
import { IdxDB } from 'idxdb';

const idxdb = await IdxDB.init(/* TODO */);
```

## Estructura del proyecto

```
64.0 KiB  idxdb/
 4.0 KiB    ├── README.md
 4.0 KiB    ├── LICENSE
 4.0 KiB    ├── index.d.ts
36.0 KiB    ├── package-lock.json
 4.0 KiB    ├── package.json
12.0 KiB    ├── __mocks__/
 4.0 KiB    │   ├── index.js
 4.0 KiB    │   └── idxdb.js
12.0 KiB    ├── src/
 4.0 KiB    │   ├── index.js
 4.0 KiB    │   └── idxdb.js
 8.0 KiB    └── __tests__/
 4.0 KiB        └── idxdb.test.js

2 directories, 8 files
```

## Pruebas

Para ejecutar las pruebas incluidas, asegúrate de tener _Vitest_ instalado y luego ejecuta:

```bash
npm run test
```

## Contribuciones

Las contribuciones son bienvenidas. Siéntete libre de abrir un _issue_ o enviar un _pull request_.

## Licencia

Este proyecto está bajo la [MIT License](https://opensource.org/licenses/MIT).