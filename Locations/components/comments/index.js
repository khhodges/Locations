'use strict';

app.comments = kendo.observable({
    onShow: function() {},
    afterShow: function() {}
});

// START_CUSTOM_CODE_comments
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_comments
(function(parent) {
    var dataProvider = app.data.defender,
        fetchFilteredData = function(paramFilter, searchFilter) {
            var model = parent.get('commentsModel'),
                dataSource = model.get('dataSource');

            if (paramFilter) {
                model.set('paramFilter', paramFilter);
            } else {
                model.set('paramFilter', undefined);
            }

            if (paramFilter && searchFilter) {
                dataSource.filter({
                    logic: 'and',
                    filters: [paramFilter, searchFilter]
                });
            } else if (paramFilter || searchFilter) {
                dataSource.filter(paramFilter || searchFilter);
            } else {
                dataSource.filter({});
            }
        },
        flattenLocationProperties = function(dataItem) {
            var propName, propValue,
                isLocation = function(value) {
                    return propValue && typeof propValue === 'object' &&
                        propValue.longitude && propValue.latitude;
                };

            for (propName in dataItem) {
                if (dataItem.hasOwnProperty(propName)) {
                    propValue = dataItem[propName];
                    if (isLocation(propValue)) {
                        dataItem[propName] =
                            kendo.format('Latitude: {0}, Longitude: {1}',
                                propValue.latitude, propValue.longitude);
                    }
                }
            }
        },
        dataSourceOptions = {
            type: 'everlive',
            transport: {
                typeName: 'Comments',
                dataProvider: dataProvider
            },
            change: function(e) {
                var data = this.data();
                for (var i = 0; i < data.length; i++) {
                    var dataItem = data[i];

                    flattenLocationProperties(dataItem);
                }
            },
            error: function(e) {
                if (e.xhr) {
                    alert(JSON.stringify(e.xhr));
                }
            },
            schema: {
                model: {
                    fields: {
                        'Comment': {
                            field: 'Comment',
                            defaultValue: ''
                        },
                        'Stars': {
                            field: 'Stars',
                            defaultValue: ''
                        },
                    }
                }
            },
            serverFiltering: true,
            serverSorting: true,
            serverPaging: true,
            pageSize: 50
        },
        dataSource = new kendo.data.DataSource(dataSourceOptions),
        commentsModel = kendo.observable({
            dataSource: dataSource,
            itemClick: function(e) {

                app.mobileApp.navigate('#components/comments/details.html?uid=' + e.dataItem.uid);

            },
            addClick: function() {
                app.mobileApp.navigate('#components/comments/add.html');
            },
            deleteClick: function() {
                var dataSource = commentsModel.get('dataSource'),
                    that = this;

                if (!navigator.notification) {
                    navigator.notification = {
                        confirm: function(message, callback) {
                            callback(window.confirm(message) ? 1 : 2);
                        }
                    };
                }

                navigator.notification.confirm(
                    "Are you sure you want to delete this item?",
                    function(index) {
                        //'OK' is index 1
                        //'Cancel' - index 2
                        if (index === 1) {
                            dataSource.remove(that.currentItem);

                            dataSource.one('sync', function() {
                                app.mobileApp.navigate('#:back');
                            });

                            dataSource.one('error', function() {
                                dataSource.cancelChanges();
                            });

                            dataSource.sync();
                        }
                    },
                    '', ["OK", "Cancel"]
                );
            },
            detailsShow: function(e) {
                var item = e.view.params.uid,
                    dataSource = commentsModel.get('dataSource'),
                    itemModel = dataSource.getByUid(item);

                if (!itemModel.Comment) {
                    itemModel.Comment = String.fromCharCode(160);
                }

                commentsModel.set('currentItem', null);
                commentsModel.set('currentItem', itemModel);
            },
            currentItem: null
        });

    parent.set('addItemViewModel', kendo.observable({
        onShow: function(e) {
            // Reset the form data.
            this.set('addFormData', {
                comment: '',
            });
        },
        onSaveClick: function(e) {
            var addFormData = this.get('addFormData'),
                dataSource = commentsModel.get('dataSource');

            dataSource.add({
                Comment: addFormData.comment,
            });

            dataSource.one('change', function(e) {
                app.mobileApp.navigate('#:back');
            });

            dataSource.sync();
        }
    }));

    if (typeof dataProvider.sbProviderReady === 'function') {
        dataProvider.sbProviderReady(function dl_sbProviderReady() {
            parent.set('commentsModel', commentsModel);
        });
    } else {
        parent.set('commentsModel', commentsModel);
    }

    parent.set('onShow', function(e) {
        var param = e.view.params.filter ? JSON.parse(e.view.params.filter) : null;

        fetchFilteredData(param);
    });
})(app.comments);

// START_CUSTOM_CODE_commentsModel
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_commentsModel