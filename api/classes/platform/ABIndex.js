const ABIndexCore = require("../core/ABIndexCore");

module.exports = class ABIndex extends ABIndexCore {
   constructor(attributes, object) {
      super(attributes, object);
   }

   /**
    * @method exportIDs()
    * export any relevant .ids for the necessary operation of this ABIndex.
    * @param {array} ids
    *         the array of relevant ids to store our .ids into.
    */
   exportIDs(ids) {
      // make sure we don't get into an infinite loop:
      if (ids.indexOf(this.id) > -1) return;

      ids.push(this.id);

      // include my fields:
      (this.fields || []).forEach((f) => {
         if (f.exportIDs) f.exportIDs(ids);
      });
   }

   ///
   /// DB Migrations
   ///

   migrateCreate(knex) {
      if (this.fields == null || !this.fields.length) return Promise.resolve();

      let indexName = this.indexName;
      let tableName = this.object.dbTableName();
      let columnNames = this.fields.map((f) => f.columnName);

      return (
         Promise.resolve()
            // Clear Index
            .then(() => this.migrateDrop(knex))
            .then(() =>
               knex.schema.alterTable(tableName, (table) => {
                  // Create new Unique to table
                  if (this.unique) {
                     // ALTER TABLE {tableName} ADD UNIQUE {indexName} ({columnNames})
                     // table.unique(columnNames, this.uniqueName);

                     sails.log(
                        `::: INDEX.UNIQUE Table[${tableName}] Column[${columnNames.join(
                           ", "
                        )}] Index[${indexName}] `
                     );
                     // Create Unique & Index
                     return knex.schema
                        .raw(
                           `ALTER TABLE ${tableName} ADD UNIQUE INDEX ${indexName}(${knex.client
                              .formatter()
                              .columnize(columnNames)})`
                        )
                        .catch((err) => {
                           sails.log.error(
                              `ABIndex.migrateCreate() Unique: Table[${tableName}] Column[${columnNames.join(
                                 ", "
                              )}] Index[${indexName}] `,
                              err
                           );
                           // throw err;
                        });
                  }
                  // Create new Index
                  else {
                     sails.log(
                        `::: INDEX Table[${tableName}] Column[${columnNames.join(
                           ", "
                        )}] Index[${indexName}] `
                     );
                     // ALTER TABLE {tableName} ADD INDEX {indexName} ({columnNames})
                     return table.index(columnNames, indexName).catch((err) => {
                        sails.log.error(
                           `ABIndex.migrateCreate(): INDEX : Table[${tableName}] Column[${columnNames.join(
                              ", "
                           )}] Index[${indexName}] `,
                           err
                        );
                        // throw err;
                     });
                  }
               })
            )
      );
   }

   migrateDrop(knex) {
      if (this.fields == null || !this.fields.length) return Promise.resolve();

      let indexName = this.indexName;
      let tableName = this.object.dbTableName();
      // let columnNames = this.fields.map((f) => f.columnName);

      return new Promise((resolve, reject) => {
         knex.schema
            .raw(`ALTER TABLE ${tableName} DROP INDEX \`${indexName}\``)
            .then(() => resolve())
            .catch((err) => {
               // Not exists
               if (err.code == "ER_CANT_DROP_FIELD_OR_KEY") return resolve();

               reject(err);
            });
      });

      // return new Promise((resolve, reject) => {
      //    knex.schema
      //       .table(tableName, (table) => {
      //          // Drop Unique
      //          if (this.unique) {
      //             table.dropUnique(columnNames, this.uniqueName);
      //          }

      //          // Drop Index
      //          table.dropIndex(columnNames, indexName);
      //       })
      //       .catch((err) => {
      //          console.error(err);
      //          resolve();
      //       })
      //       .then(() => resolve());
      // });
   }
};
