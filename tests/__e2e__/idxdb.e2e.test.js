// tests/__e2e__/idxdb.e2e.test.js
import { expect, test } from '@playwright/test';

test('IndexedDB CRUD operations', async ({ page }) => {
  // Navega a tu aplicación
  await page.goto('http://localhost:3000'); // Cambia a la URL de tu aplicación

  // Realiza una operación para crear un nuevo registro en IndexedDB
  await page.click('button#add-item'); // Supón que tienes un botón para añadir un item

  // Verifica que el registro se haya añadido
  const item = await page.evaluate(() => {
    return new Promise((resolve) => {
      const request = indexedDB.open('testDB', 1);
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction('testObjectStore', 'readonly');
        const objectStore = transaction.objectStore('tuObjectStore');
        const getRequest = objectStore.get('idDelItemAgregado'); // Reemplaza con el ID del item que agregaste
        getRequest.onsuccess = () => resolve(getRequest.result);
      };
    });
  });

  expect(item).toBeDefined(); // Verifica que el item fue creado

  // Realiza otras operaciones como update y delete, de manera similar
});
