module.exports = class ABExternal {
   constructor(application) {
      this.application = application;
   }

   connectionFind() {
      return new Promise((resolve, reject) => {
         OP.Comm.Socket.get({
            url: "/app_builder/external/connections"
         })
            .then((connectionNames) => {
               resolve(connectionNames);
            })
            .catch(reject);
      });
   }

   tableFind(connName) {
      return new Promise((resolve, reject) => {
         var params = "";
         if (connName) {
            params = "?connection=" + connName;
         }

         OP.Comm.Socket.get({
            url:
               "/app_builder/external/application/" +
               this.application.id +
               params
         })
            .then((tableNames) => {
               resolve(tableNames);
            })
            .catch(reject);
      });
   }

   tableColumns(tableName, connName) {
      return new Promise((resolve, reject) => {
         var params = "";
         if (connName) {
            params = "?connection=" + connName;
         }

         // OP.Comm.Socket.get({
         OP.Comm.Service.get({
            url:
               "/app_builder/external/model/" + tableName + "/columns" + params
         })
            .then((columnInfos) => {
               resolve(columnInfos);
            })
            .catch(reject);
      });
   }

   tableImport(tableName, columnNames, connName) {
      return new Promise((resolve, reject) => {
         var params = "";
         if (connName) {
            params = "?connection=" + connName;
         }

         OP.Comm.Service.post({
            url:
               "/app_builder/external/application/" +
               this.application.id +
               "/model/" +
               tableName +
               params,
            params: {
               columns: columnNames
            }
         })
            .then((objectList) => {
               resolve(objectList);
            })
            .catch(reject);
      });
   }
};
