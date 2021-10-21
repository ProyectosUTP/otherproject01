var pricingEstimatesGrid = (function ($, _, authorization, ko, rateCard, pricingEstimates, pricingEstimatesGridColumns,
    saveEstimates, copyPricingEstimate, estimateIndexGrid, episodeGrid, episodeTotalsGrid, streamIndex, pricingEstimatesGridFilterBuilder, uploadEstimates, rolloverEstimates, slickGridCommon) {
    'use strict';

    const generalErrorMessage = 'An issue was encountered. Please try again later or contact your administrator for more information.';
    const generalErrorTitle = 'General Error';
    var noEpisodeLevelEstimatesmessage = "No Episode Level Estimates exist for the selected Selling Rotation Quarter.";
    var adjustDemosButton;
    var adjustEstimatesButton;
    var copyEstimates;
    var copyEstimatesActionMenu;
    var copyEstimatesButton;
    var copyEstimatesRatingsViewModel;
    var currentRatecardVersionRevisions = [];
    var currentKey = 'current';
    var deleteRowsButton;
    var deliveryStreamDropdown;
    var estimateAdjustmentViewModel;
    var exportToExcelButton;
    var grid;
    var gridRows;
    var indexRowsButton;
    var episodeGridButton;
    var indexRowsViewModel;
    var mainContent;
    var pasteEstimatesButton;
    var releaseRateCardButton;
    var releaseRateCardViewModel;
    var rolloverButton;
    var rolloverEstimatesViewModel;
    var searchViewModel;
    var showSelectedRowsCheckbox;
    var staticColumnDropdownButton;
    var toolbarViewModel;
    var uploadButton;
    var vphByBaseDemoButton;

    var unsavedChangesViewModel = {
        unsavedIds: ko.observableArray([]),
        add: function (entityId) {
            var self = this;

            if (self.unsavedIds().indexOf(entityId) === -1) {
                self.unsavedIds.push(entityId);
            }
        }
    };

    var defaultValueForCheckboxesInHeader = function () {
        toolbarViewModel.showStreamIndices(false);
        toolbarViewModel.adjustOtherStreams(true);
    };

    var clearGrid = function () {

        //defaultValueForCheckboxesInHeader();
        if (grid && grid.getDataLength() > 0) {
            grid.destroy();
            grid = undefined;

            staticColumnDropdownButton.attr('disabled', 'disabled');
            showSelectedRowsCheckbox.prop('checked', false);
        }

        toolbarViewModel.gridIsPopulated(false);
        toolbarViewModel.lockAdjustOtherStreams(false);

        releaseRateCardViewModel.releaseComments('');
        mainContent.hide();
    };
    var copyRow = function (rowToCopy) {
        return new viewModels.PricePeriodEstimate(rowToCopy.getDataForAjax(), rowToCopy.rowType);
    };


    var copyEstimateImpressions = function () {
        copyPricingEstimate.clearCopyInformation();
        var estimateToCopy = slickGridCommon.getSelectedRowItems(grid)[0];

        var estimateStreamsToCopy = Slick.Data.copyEstimates(grid, estimateToCopy);
        copyPricingEstimate.setSourceEstimates(estimateStreamsToCopy);

        grid.setSelectedRows([]);
    };
    var copyEstimateRatings = function () {
        copyEstimatesRatingsDialog.open(copyEstimatesRatingsViewModel, grid)
            .then(function (selectedPricingDemographicId) {
                copyEstimateImpressions();
                copyPricingEstimate.setPricingDemographicId(selectedPricingDemographicId);
            })
            .fail(function () {
                copyPricingEstimate.clearCopyInformation();
                grid.setSelectedRows([]);
            });
    };
    var expandCollapsePackageRows = function (targetWasCollapsed, deliveryStreamValue) {
        // call expandCollapse on each pertinent package row
        grid.getData().getItems().forEach(function (row) {
            if (row.isPackage && row.sellingRotationsAreHidden === targetWasCollapsed &&
                row.deliveryStream === deliveryStreamValue && row.visible) {
                handleExpandCollapse(row, targetWasCollapsed);
            }
        });
    };
    var forceExpandAll = function () {
        var target = $('.expandCollapseAll');

        expandCollapsePackageRows(true, deliveryStreamDropdown.val());

        // toggle the header expand all/collapse all icon
        target.removeClass('collapsed');

        pricingEstimatesGridFilterBuilder.apply();
        grid.invalidate();
    };
    var generateIndexGridDto = function () {
        var doIndexGridFilter = function (allRows, version, pricePeriod) {
            return _.filter(allRows, function (element) {
                if (element.quarter === pricePeriod) {
                    return (version === 'Current') ? element.isCurrent : (element.ratecardVersionDisplay === version);
                }
            });
        };

        //  Filter out common factors
        var tempData = _.filter(grid.getData().getItems(), function (element) {
            return (_.contains([pricingEstimates.rowTypes.released, pricingEstimates.rowTypes.draft, pricingEstimates.rowTypes.actual], element.rowType));
        });

        //  Filter sets
        var sorvData = doIndexGridFilter(tempData, indexRowsViewModel.setOneVersion(), indexRowsViewModel.setOneSelectedQuarter());
        var strvData = doIndexGridFilter(tempData, indexRowsViewModel.setTwoVersion(), indexRowsViewModel.setTwoSelectedQuarter());

        //  initializationData has two sets - one and two - where each set represents
        //  data that was selected by quarter and rate card release.  
        var unionedData = _.union(sorvData, strvData);

        var data = [];

        toolbarViewModel.availableDeliveryStreams().forEach(function (stream) {
            var streamData = _.where(unionedData, { 'deliveryStream': stream.Name });

            //  Now, group the data by selling rotation - and discard any group that has
            //  only ONE element - since there's no way to compare that oddball by SR.
            var groupedData = _.filter(_.groupBy(streamData, "sellingRotationId"), function (d) {
                return d.length > 1;
            });

            //  For every stream, execute the push
            groupedData.forEach(function (outer) {
                if ((outer[0].quarter === indexRowsViewModel.setOneSelectedQuarter()) &&
                    ((outer[0].ratecardVersionDisplay === indexRowsViewModel.setOneVersion())
                        || (outer[0].isCurrent && indexRowsViewModel.setOneVersion() === 'Current'))) {
                    data.push({ setOne: outer[0], setTwo: outer[1] });
                }
                else {
                    data.push({ setOne: outer[1], setTwo: outer[0] });
                }
            });
        });
        return data;
    };
    var getCurrentReleasedRow = function (draftRow) {
        return _.filter(grid.getData().getItems(), function (row) {
            return row.sellingRotationId === draftRow.sellingRotationId
                && row.quarter === draftRow.quarter
                && row.rowType === pricingEstimates.rowTypes.released
                && row.deliveryStream === draftRow.deliveryStream
                && row.isCurrent;
        });
    };
    var handleExpandCollapse = function (packageRow, targetWasCollapsed) {
        // set the packageIsCollapsed on each associated SR so the filter hides them
        grid.getData().getItems().forEach(function (row) {
            if (row.deliveryStream === packageRow.deliveryStream &&
                row.quarter === packageRow.quarter &&
                row.packageId === packageRow.packageId &&
                ((row.ratecardVersion === packageRow.ratecardVersion && row.ratecardRevision === packageRow.ratecardRevision) ||
                    ((row.rowType === pricingEstimates.rowTypes.draft || row.rowType === pricingEstimates.rowTypes.working) && packageRow.isCurrent))
                && row.sellingRotationId !== 0) {
                row.packageIsCollapsed = !targetWasCollapsed;
            }
        });

        // set the sellingRotationsAreHidden on the package row which toggles the expand/collapse icon class
        packageRow.sellingRotationsAreHidden = !targetWasCollapsed;
    };
    var isQuarterCurrentOrFuture = function (quarter) {
        var currentQuarter = currQtr.substring(0, 1);
        var currentYear = currQtr.substring(3);

        if (quarter.Year > currentYear) {
            return true;
        }

        if (quarter.Year < currentYear) {
            return false;
        }

        if (quarter.QuarterNumber < currentQuarter) {
            return false;
        }

        return true;
    };
    var initialize = function () {
        var searchPanel = $('.ad-search');
        adjustEstimatesButton = $('#adjustEstimates');
        copyEstimatesButton = $('#copyEstimates');
        pasteEstimatesButton = $('#pasteEstimates');
        staticColumnDropdownButton = $('#staticColumnDropdownButton');
        adjustDemosButton = $('#adjustDemosButton');
        mainContent = $('#mainContent');
        deliveryStreamDropdown = $('#DeliveryStream');
        releaseRateCardButton = $('#releaseRateCard');
        vphByBaseDemoButton = $('#vphByBaseDemo');
        indexRowsButton = $('#indexRowsButton');
        episodeGridButton = $('#episodeGridButton');
        showSelectedRowsCheckbox = $('#ShowSelectedGridRows');
        deleteRowsButton = $('#deleteRowsButton');
        uploadButton = $('#uploadButton');
        rolloverButton = $('#rolloverEstimates');
        exportToExcelButton = $('#exportToExcelButton');

        searchPanel.adSalesSearch({
            initialize: function () {
                $(this).find('input').first().focus();
            },
            searchCallback: function () {
                search();
            },
            showMask: rateCard.mask.show,
            //removeMask: rateCard.mask.remove,
            getCurrentUnsavedSearch: function () {
                return new viewModels.SavedSearchViewModel(null, null, ko.toJSON(searchViewModel), null);
            },
            savedSearchType: 'rateCardGrid',
            savedSearchApplication: 'rateCard',
            searchDataBind: 'enable: searchButtonEnabled, attr: { title: searchButtonHoverText }',
            clearCallback: function () {
                searchViewModel.reset();
                $.EventBus(adSalesSplitterEvents.destroySplitter).publish();
                clearGrid();
            },
            filterClearCallback: function () {
                $.EventBus(filterEvents.applyFilter).publish('deliveryStream', deliveryStreamDropdown.val());
            }
        });

        registerEventHandlers();

        searchViewModel = new viewModels.PricingEstimatesGridSearchViewModel();
        toolbarViewModel = new viewModels.PricingEstimatesToolbarViewModel();
        releaseRateCardViewModel = new viewModels.ReleaseRateCardViewModel();
        rolloverEstimatesViewModel = new viewModels.RolloverEstimatesViewModel();
        copyEstimatesRatingsViewModel = new viewModels.CopyEstimatesRatingsViewModel();

        uploadEstimates.initialize({
            selector: '#fileUpload'
        });

        initializeCheckboxArrays();
        initializeCategorySubcategoryDropdown();
        initializeProgramCategoriesAndCodesDropdown();
        initializeSellingRotationsDropdown();
        initializePackageDropdown();
        initializeOutletsDropDown();
        initializeDeliveryStreamDropdown();
        initializeOtaWidget();
        initializeCopyOptions();
        initializeRatecardIdDropdown();
        initializeDaypartDropdown();
        initializeRolloverButton();

        ko.applyBindings(searchViewModel, searchPanel[0]);
        if ($('.ad-ratecard-grid-button-container')[0] !== undefined) {
            ko.applyBindings(unsavedChangesViewModel, $('.ad-ratecard-grid-button-container')[0]);
        }

        if ($('.rc-toolbar')[0] !== undefined) {
            ko.applyBindings(toolbarViewModel, $('.rc-toolbar')[0]);
        }
    };
    var initializeCategorySubcategoryDropdown = function () {
        var categories = $('#Categories');
        categories.attr('data-placeholder', " ")
            .modifiedChosen({
                search_contains: true,
                groups_are_selectable: true,
                inhibit_auto_collapse: true,
                show_selected_in_list: true,
                show_titles_in_dropdown: true
            })
            .change(function () {
                var $select = $(this),
                    $inputToFocus = $('#' + $select.attr('id') + '_chzn').find('input').first();

                $inputToFocus.focus();
            });

        rateCard.utils.populateSellingRotationCategoryAndSubcategoryDropdown(categories);
    };
    var initializeCheckboxArrays = function () {
        $('#LiveTypeDiv').checkBoxArray({
            labelText: 'Live',
            checkBoxes: [
                { id: 'LIVE_L', labelText: 'Live', value: 1, checked: true },
                { id: 'LIVE_NL', labelText: 'Non Live', value: 2, checked: true }
            ],
            oneBoxMustBeChecked: true
        });

        $('#ActiveTypeDiv').checkBoxArray({
            labelText: 'Active',
            checkBoxes: [
                { id: 'ACTIVE', labelText: 'Active', value: 1, checked: true },
                { id: 'INACTIVE', labelText: 'Inactive', value: 2, checked: false }
            ],
            oneBoxMustBeChecked: true
        });

        $('#SaleStatusTypeDiv').checkBoxArray({
            labelText: 'Sale Status',
            checkBoxes: [
                { id: 'INSALE', labelText: 'In Sale', value: 1, checked: true },
                { id: 'OUTOFSALE', labelText: 'Out of Sale', value: 2, checked: true }
            ],
            oneBoxMustBeChecked: true
        });
    };
    var initializeCopyOptions = function () {
        copyEstimatesActionMenu = $('.copyActions');
        copyEstimates = function () {
            var iconPosition = $("#copyEstimates").position();

            iconPosition.top = iconPosition.top + 38;
            iconPosition.left = iconPosition.left + -40;
            iconPosition.zIndex = 1000;

            copyEstimatesActionMenu.removeClass('hidden').css(iconPosition);
        };

        $('li', copyEstimatesActionMenu).on('click', function (e) {
            var action = $(this).data('action');
            e.stopPropagation();

            switch (action) {
                case 'copyImps':
                    copyEstimateImpressions();
                    break;
                case 'copyRatings':
                    copyEstimateRatings();
                    break;
            }

            copyEstimatesActionMenu.addClass('hidden');
        });

        // hide pop-up
        $(document).on('click', function (e) {
            if (!$(e.target).is('#copyEstimates')) {
                copyEstimatesActionMenu.addClass('hidden');
            }
        });
    };

    var defaultActiveColumnForSaticColumns = function () {
        // only include the active column if they searched for both active and inactive SRs
        if (searchViewModel.Active() === pricingEstimates.activeButtonValues.both) {
            pricingEstimatesGridColumns.show(['active'], pricingEstimates.columnTypes.static);
            pricingEstimatesGridColumns.applyChanges();
        }
    };

    var defaultValueOfDeliveryStreamDropdown = function () {
        if (authorization.userDivision() === 'RADIO') {
            toolbarViewModel.selectedDeliveryStream(pricingEstimates.streamDefaults.Radio);
        } else {
            toolbarViewModel.selectedDeliveryStream(pricingEstimates.streamDefaults.Domestic);
        }
    };

    var initializeDeliveryStreamDropdown = function () {
        var getDeliveryStreamsData = function () {
            return rateCard.ajax({
                url: rateCard.applicationUrl + '/api/deliveryStreams',
                type: 'GET'
            });
        };

        getDeliveryStreamsData().then(function (deliveryStreams) {
            toolbarViewModel.availableDeliveryStreams(deliveryStreams);
            searchViewModel.DeliveryStreamNames(_.pluck(deliveryStreams, 'Name'));
            defaultValueOfDeliveryStreamDropdown();
        });
    };

    var initializeOtaWidget = function () {
        $('.RadioButtonSet').buttonize({
            oneBoxMustBeChecked: true
        });
    };
    var initializeOutletsDropDown = function () {
        var dropdown = $('#Outlets');
        rateCard.utils.populateOutletDropDown(dropdown).then(function () {
            dropdown.rateCardDropdown();
        });
    };
    var initializePackageDropdown = function () {
        var getPackageRotationsData = function () {
            return rateCard.ajax({
                url: rateCard.applicationUrl + '/api/packages/names',
                type: 'GET'
            });
        };

        var dropdown = $('#PackageRotationIds');

        getPackageRotationsData().then(function (packageRotations) {
            packageRotations.forEach(function (packageRotation) {
                var option = $('<option>').val(packageRotation.Id).text(packageRotation.Id + ' - ' + packageRotation.Name);
                dropdown.append(option);
            });


            dropdown.rateCardDropdown({
                width: '291'
            });
        });
    };
    var initializeProgramCategoriesAndCodesDropdown = function () {
        var programs = $('#ProgramCategoriesAndCodes');
        programs
            .attr('data-placeholder', " ")
            .modifiedChosen({
                search_contains: true,
                groups_are_selectable: true,
                inhibit_auto_collapse: true,
                show_selected_in_list: true,
                show_titles_in_dropdown: true
            })
            .change(function () {
                var $select = $(this),
                    $inputToFocus = $('#' + $select.attr('id') + '_chzn').find('input').first();

                $inputToFocus.focus();
            });

        rateCard.utils.populateProgramCategoryAndCodeDropdown(programs, true);
    };
    var initializeSellingRotationsDropdown = function () {
        var getSellingRotationsData = function () {
            return rateCard.ajax({
                url: rateCard.applicationUrl + '/api/sellingrotations/names',
                type: 'GET'
            });
        };

        var dropdown = $('#SellingRotationIds');

        getSellingRotationsData().then(function (sellingRotations) {
            sellingRotations.forEach(function (sellingRotation) {
                var option = $('<option>').val(sellingRotation.Id).text(sellingRotation.Id + ' - ' + sellingRotation.Name);
                dropdown.append(option);
            });


            dropdown.rateCardDropdown({
                width: '291'
            });
        });
    };

    var initializeDaypartDropdown = function () {
        var getDayPartData = function () {
            return rateCard.ajax({
                url: rateCard.applicationUrl + '/api/dayparts/',
                type: 'GET'
            });
        };

        var dropdown = $('#Dayparts');

        getDayPartData().then(function (dayparts) {
            var sortedData = _.sortBy(dayparts, 'Code');
            sortedData.forEach(function (daypart) {
                var option = $('<option>').val(daypart.Id).text(daypart.FormattedDescription);
                dropdown.append(option);
            });


            dropdown.rateCardDropdown({
                width: '291'
            });
        });
    };

    var initializeRatecardIdDropdown = function () {
        var getRateCardData = function () {
            return rateCard.ajax({
                url: rateCard.applicationUrl + '/api/RateCards/GetRateCardsForDivision',
                type: 'GET'
            });
        };

        var dropdown = $('#RatecardId');

        getRateCardData().then(function (rateCards) {
            if (rateCards.length === 1) {
                var option = $('<option selected>').val(rateCards[0].Id).text(rateCards[0].Id + " - " + rateCards[0].Description);
                dropdown.append(option);
                searchViewModel.RatecardId(rateCards[0].Id);
            }
            else {
                rateCards.forEach(function (rateCard) {
                    var option;
                    if (rateCards[0].Id === rateCard.Id) {
                        option = $('<option selected>').val(rateCard.Id).text(rateCard.Id + " - " + rateCard.Description);
                    }
                    else {
                        option = $('<option>').val(rateCard.Id).text(rateCard.Id + " - " + rateCard.Description);
                    }

                    dropdown.append(option);
                });
                searchViewModel.RatecardId(rateCards[0].Id);
            }
            dropdown.rateCardDropdown({
                width: '291'
            });
        });

    };

    var initializeRolloverButton = function () {
        var getFeatureFlagRolloverButtonEnable = function () {
            return rateCard.ajax({
                url: rateCard.applicationUrl + '/api/featureFlags/RolloverButtonEnable',
                type: 'GET'
            });
        };

        getFeatureFlagRolloverButtonEnable().then(function (result) {
            if (typeof result.IsEnabled !== "undefined") {
                toolbarViewModel.rolloverButtonEnable(result.IsEnabled);
            }
        });
    };

    var openIndexGridModal = function () {
        var options = {
            title: 'Index',
            open: function () {
                ko.applyBindings(indexRowsViewModel, this.element[0]);
            },
            width: '410px',
            buttons: [
                {
                    text: 'Cancel',
                    type: 'secondaryLink',
                    click: function () {
                        indexRowsViewModel.reset();
                        this.destroy();
                    }
                },
                {
                    text: 'Clear',
                    type: 'secondaryButton',
                    click: function () {
                        indexRowsViewModel.clear();
                    }
                },
                {
                    text: 'Apply',
                    type: 'primaryButton',
                    click: showIndexGrid,
                    dataBind: 'enable: canApplyIndexRows, attr: { title: hoverText }'
                }
            ]
        };

        var quartersByVersion = _.mapValues(_.groupBy(grid.getData().getItems(), 'ratecardVersionDisplay'), function (row) {
            return _.uniq(_.pluck(row, 'quarter'));
        });

        indexRowsViewModel.initialize(quartersByVersion);

        $('.indexRowsWindow')
            .clone()
            .removeClass('hidden')
            .adSalesWindow(options)
            .center()
            .open();
    };
    var getCurrentRatecardVersionRevision = function () {
        return rateCard.ajax({
            url: rateCard.applicationUrl + '/api/pricingEstimates/currentVersionRevision/' + searchViewModel.RatecardId(),
            type: 'GET'
        });
    };
    var populateCurrentRatecardVersionRevisions = function (newRatecardVersionRevision) {
        if (typeof newRatecardVersionRevision !== "undefined") {
            currentRatecardVersionRevisions = [];
            return currentRatecardVersionRevisions.push({
                ratecardId: newRatecardVersionRevision[0].ratecardId,
                version: newRatecardVersionRevision[0].version,
                revision: rateCard.utils.padString(newRatecardVersionRevision[0].revision, 5, '0', true),
                releaseNotes: newRatecardVersionRevision[0].releaseNotes
            });
        }

        return getCurrentRatecardVersionRevision().then(function (currentVersionRevision) {
            currentRatecardVersionRevisions = [];
            currentRatecardVersionRevisions.push({
                ratecardId: currentVersionRevision.RatecardId,
                version: currentVersionRevision.Version,
                revision: rateCard.utils.padString(currentVersionRevision.Revision, 5, '0', true),
                releaseNotes: currentVersionRevision.ReleaseNotes
            });
        });
    };

    var pricingEstimateSearch = (searchViewModelData) => {
        const fetchCriteria = {
            url: rateCard.applicationUrl + '/api/PricingEstimates/search',
            method: ese.fetch.METHOD.POST,
            body: searchViewModelData,
            fetchStart: () => { rateCard.mask.show(); },
            fetchStop: () => { rateCard.mask.remove(); }
        };

        return ese.fetch(fetchCriteria);
    };

    var displayToastErrorMessage = (error) => {
        if (error && error.body && error.body.status === 400) {
            const conditions = error.body.content.Conditions;
            var textToShow = conditions.map(x => x.Message).join('<br />');

            toastr.dialog.error(textToShow, { showAsHtml: true })
                .addButton('OK');
        }
        else if (error.body) {
            (error.body.exceptionType === 'System.ApplicationException' || typeof error.body.exceptionType === 'undefined')
                ? toastr.error(generalErrorMessage, generalErrorTitle)
                : toastr.error(error.body.exceptionMessage);
        }
        else {
            console.log("Unhandled code error", error);
        }
    };

    var getGridData = function () {
        var deferred = $.Deferred();

        if (!searchViewModel.isValid()) {
            return deferred.reject();
        }

        var allEstimates = { Estimates: [] };
        var deliveryStreams = searchViewModel.DeliveryStreamNames();

        var searchViewModelData = JSON.parse(searchViewModel.getDataForAjax());
        searchViewModelData.DeliveryStreamNames = deliveryStreams.splice(0);

        pricingEstimateSearch(searchViewModelData)
            .then(function (results) {
                let estimates = results.body;

                if (estimates.length > 0) {
                    allEstimates.Estimates = allEstimates.Estimates.concat(estimates);
                }

                deferred.resolve(allEstimates);
            })
            .catch(function (reason) {
                displayToastErrorMessage(reason);
                deferred.reject(allEstimates);
            });

        return deferred.promise();
    };

    var populateGrid = function () {
        var gridOptions = {
            editable: true,
            enableCellNavigation: true,
            asyncEditorLoading: true,
            explicitInitialization: true,
            fullWidthRows: true,
            leaveSpaceForNewRows: false,
            enableColumnReorder: false,
            rowHeight: 35,
            dataItemColumnValueExtractor: slickGridCommon.getColumnValue
        };

        var registerGridEventSubscriptions = function () {
            var rowStateBeingEdited;
            var getCurrentValue = function (args) {
                var allColumns = grid.getColumns();
                var updatedRatingRow = args.item;

                return slickGridCommon.getColumnValue(updatedRatingRow, allColumns[args.cell]);
            };

            var handleExpandCollapseAll = function (target) {
                var targetWasCollapsed = target.is('.collapsed');

                // call expandCollapse on each package row
                expandCollapsePackageRows(targetWasCollapsed, deliveryStreamDropdown.val());

                // toggle the header expand all/collapse all icon
                target.toggleClass('collapsed');
            };

            var handleDemoBreakOut = function (e, args) {
                var demoCode = grid.getColumns()[args.cell].demoCode;
                var pricePeriod = grid.getData().getItemByIdx(args.row);
                $("#demoBreakOutWindow").demoBreakOutWindow({
                    demoCode: demoCode,
                    pricePeriod: pricePeriod,
                    grid: grid,
                    gridUpdateCallBack: updateEstimate
                });
                e.stopPropagation();
                e.preventDefault();
                return true;
            };

            grid.onHeaderClick.subscribe(function (e, args) {
                if (args.column.id === 'expandCollapse') {
                    handleExpandCollapseAll($(e.target));
                    pricingEstimatesGridFilterBuilder.apply();
                    grid.invalidate();
                }

                return true;
            });

            grid.onClick.subscribe(function (e, args) {
                var target = $(e.target);
                if (target.is('.expandCollapse')) {
                    handleExpandCollapse(grid.getData().getItem(args.row), $(e.target).is('.collapsed'));
                    pricingEstimatesGridFilterBuilder.apply();
                    grid.invalidate();
                } else if (target.is('.demoBreakOutButton') && toolbarViewModel.adjustOtherStreams()) {
                    return handleDemoBreakOut(e, args);
                }

                return true;
            });

            grid.onBeforeEditCell.subscribe(function (e, args) {
                var row = args.item;

                if (!toolbarViewModel.adjustOtherStreams()) {
                    //only enable impression edits
                    if (!(args.column.id.includes('impression') || args.column.id === 'HHota')) {
                        $('#toast-container').empty();
                        var errorDialog = $('<span></span>').text("Only Impressions can be edited when Index Calculation is disabled.");
                        toastr.warning(errorDialog, null, { showAsHtml: true });
                        return false;
                    }
                }

                if (args.column.id === 'releaseNotes' && row.isWorking()) {
                    return false;
                }

                if (row.isWorking()) {
                    if (row.hasOta() && toolbarViewModel.includeOta() === 'no') {
                        toastr.warning('Please select Include OTA = YES to be able to edit a row with OTA.');
                        return false;
                    }

                    // clone the row and prepare it to be pushed into the undo stack
                    rowStateBeingEdited = copyRow(row);

                    return getCurrentValue(args) !== undefined;
                }

                // comments are always at least read only, so have to access the editor
                if (args.column.id === 'comments') {
                    return row.comments !== null;
                }

                if (args.column.id === 'releaseNotes') {
                    return row.releaseNotes !== null;
                }

                // this is a released row and not the read-only comments column, no editor should trigger
                return false;
            });

            grid.onCellChange.subscribe(function (e, args) {
                var column = grid.getColumns()[args.cell];
                var entityId = args.item.entityId;
                toolbarViewModel.lockAdjustOtherStreams(true);

                var affectedEstimates = Slick.Data.getAffectedEstimates(grid, entityId);

                column.onChange({
                    entityId: entityId,
                    demoCode: column.demoCode,
                    originatingStream: args.item.deliveryStream,
                    updatedValue: getCurrentValue(args),
                    estimates: affectedEstimates,
                    adjustOtherStreams: toolbarViewModel.adjustOtherStreams()
                }).then(function (results) {
                    results.forEach(function (result) {
                        updateEstimate(result);
                    });
                });
            });

            grid.onSelectedRowsChanged.subscribe(function () {
                var selectedRows = slickGridCommon.getSelectedRowItems(grid);

                grid.getData().getItems().forEach(function (row) {
                    row.selected = false;
                });

                selectedRows.forEach(function (row) {
                    row.selected = true;
                });

                // remove copy imp/copy ratings popup.
                if (selectedRows.length === 0) {
                    copyEstimatesActionMenu.removeClass('hidden').addClass("hidden");
                }

                toolbarViewModel.selectedRows(selectedRows);
                toolbarViewModel.someRowsAreOrphaned(selectedRowsHaveOrphanedRows());

            });

            var unfrozenArea = $('.slick-viewport-right');
            $('.slick-viewport-left').on('mousewheel', function (e) {
                unfrozenArea.scrollTop(unfrozenArea.scrollTop() - e.originalEvent.wheelDelta);
            });
        };

        return getGridData().then(function (estimatesResults) {
            var estimates = estimatesResults.Estimates;

            if (estimates.length === 0) {
                // remove the permanent warning toast we displayed above
                $('#toast-container').empty();

                toastr.warning('No results found for your search criteria.');
                return $.Deferred().reject();
            }

            unsavedChangesViewModel.unsavedIds([]);
            toolbarViewModel.unsavedRows([]);

            gridRows = convertEstimatesToGridRows(estimates);

            var dataView = new Slick.Data.DataView();

            // initialize with empty columns. we will build the columns after we have a grid reference
            grid = new Slick.Grid('.ad-ratecard-grid', dataView, [], gridOptions);
            grid.setSelectionModel(new Slick.RowSelectionModel({ selectActiveRow: false }));

            registerGridEventSubscriptions();

            // 25 pixels per row, plus 25 for the header, plus 8 for the scrollbar
            $('.ad-ratecard-grid').height(((gridRows.length) * 25) + 25 + 8);

            dataView.setItems(gridRows);
            dataView.getItemMetadata = Slick.Data.decorateMetadata(dataView.getItemMetadata);
            dataView.setFilter(function (row) {
                return row.visible;
            });
            dataView.onRowCountChanged.subscribe(function () {
                grid.updateRowCount();
                grid.render();
            });
            dataView.onRowsChanged.subscribe(function (e, args) {
                grid.invalidateRows(args.rows);
                grid.render();
            });
            // make sure rows that get hidden do not remain selected
            dataView.syncGridSelection(grid, false);

            grid.init();

            if (searchViewModel.IncludeAOP()) {
                pricingEstimatesGridColumns.showAopColumns();
            } else {
                pricingEstimatesGridColumns.hideAopColumns();
            }

            // this must happen after the grid data is set
            pricingEstimatesGridColumns.build(grid).applyColoringToHeaders();

            defaultActiveColumnForSaticColumns();

            if (deliveryStreamDropdown.val() === pricingEstimates.deliveryStreams.NR) {
                pricingEstimatesGridColumns.hideMetricColumns();
            }

            // if any row has any source type, show the source type column
            showSourceColumn(gridRows);

            // this must happen after the columns are built since it may try to show or hide OTA metrics
            toolbarViewModel.gridIsPopulated(true);
            //setIncludeOta(gridRows);

            staticColumnDropdownButton.removeAttr('disabled');
            //pricingEstimatesGridSettings.removeAttr('disabled');

            mainContent.show();
            resizePricingEstimatesGrid(mainContent);
            pricingEstimatesGridFilterBuilder.initialize(grid);
            estimateAdjustmentViewModel = new viewModels.EstimateAdjustmentViewModel(grid);
            indexRowsViewModel = new viewModels.IndexRowsViewModel();
            if ($('.ad-search-toggle-open').length > 0) {
                $('.ad-search-toggle-open').click();
            }

            //applying the saved settings by the user from the proxy api.
            var saveUserGridSettings;
            var objCode = "ADVSR_RTCRD_PE_GRID";
            const result = ese.fetch({
                url: rateCard.applicationUrl + '/api/UserSettings/' + objCode,
                method: ese.fetch.METHOD.GET
            }).then(data => {
                rateCard.mask.show();
                saveUserGridSettings = data.body;
                if (saveUserGridSettings !== undefined && saveUserGridSettings !== "") {
                    saveUserGridSettings = JSON.parse(saveUserGridSettings);
                    var selectedColumns = _.compact(saveUserGridSettings.Columns);

                    if (selectedColumns.length > 0) {
                        var hideColumns = pricingEstimatesGridColumns.getShowing(pricingEstimates.columnTypes.static);
                        hideColumns.forEach(function (hideColumn) {
                            pricingEstimatesGridColumns.hide([hideColumn], pricingEstimates.columnTypes.static);






                        });

                        selectedColumns.forEach(function (selectedColumn) {
                            pricingEstimatesGridColumns.show([selectedColumn], pricingEstimates.columnTypes.static);
                        });
                        pricingEstimatesGridColumns.applyChanges();
                    }
                    var selectedIncludeOta = saveUserGridSettings.includeOTA;
                    if (selectedIncludeOta !== null) {
                        toolbarViewModel.includeOta(selectedIncludeOta);

                    }
                    var selectedDeliveryStream = saveUserGridSettings.deliveryStream;
                    if (selectedDeliveryStream !== null) {
                        toolbarViewModel.selectedDeliveryStream(selectedDeliveryStream);
                        deliveryStreamDropdown.trigger("chosen:updated");
                        deliveryStreamDropdown.trigger('change');
                    }
                    var selectedIndex = saveUserGridSettings.index;
                    if (selectedIndex !== null) {
                        toolbarViewModel.showStreamIndices(selectedIndex);
                        //pricingEstimatesGridColumns.showIndexColumns(selectedIndex, selectedDeliveryStream, _.pluck(toolbarViewModel.availableDeliveryStreams(), "Name"));
                    }
                    var adjustOtherStreams = saveUserGridSettings.adjustOtherStreams;
                    if (adjustOtherStreams !== null) {
                        toolbarViewModel.adjustOtherStreams(adjustOtherStreams);
                    }
                    var showingDemos = saveUserGridSettings.showingDemos;
                    var showingMetrics = saveUserGridSettings.showingMetrics;
                    var hiddenMetrics = saveUserGridSettings.hiddenMetrics;

                    if (showingDemos !== null && showingMetrics !== null && hiddenMetrics !== null) {
                        if (showingDemos !== "" && showingMetrics !== "" && hiddenMetrics !== "") {

                            pricingEstimatesGridColumns.saveDemoAndMetricPreferences(showingDemos, showingMetrics);

                            pricingEstimatesGridColumns.hide(hiddenMetrics, pricingEstimates.columnTypes.metric);
                            pricingEstimatesGridColumns.hideAll(pricingEstimates.columnTypes.demo);

                            pricingEstimatesGridColumns.show(showingMetrics, pricingEstimates.columnTypes.metric);
                            pricingEstimatesGridColumns.show(showingDemos, pricingEstimates.columnTypes.demo);

                            pricingEstimatesGridColumns.applyChanges();
                        }
                    }
                    setTimeout(function () { rateCard.mask.remove() }, 8000);
                }
            }).catch(error => {
                //if (error.response.status !== 404) {
                //    toastr.error(error);
                //}
                defaultValueForCheckboxesInHeader();
                setIncludeOta(gridRows);
                rateCard.mask.remove();
                console.log(error);
            });

            // remove the permanent warning toast we displayed above
            $('#toast-container').empty();
        });
    };

    var shouldShowWorkingRow = function (sellingRotationRow) {
        return searchViewModel.IncludeWorkingRow() &&
            isQuarterCurrentOrFuture(sellingRotationRow.Quarter) &&
            authorization.CanEditRcGrid() &&
            sellingRotationRow.Active &&
            sellingRotationRow.IsCurrent &&
            sellingRotationRow.RatecardReleaseId &&
            sellingRotationRow.EstimateType !== pricingEstimates.estimateTypes.actual;
    };

    var ratecardVersionDisplaySortingEnum = {
        "Current (Removed)": 4,
        "Current": 3,
        "Working": 2,
        "Working (Draft)": 1,
        "Actual": 0
    };

    var sortGroupedGridRows = (rows) => {
        rows.sort(function (a, b) {

            // The individual rows should be sorted by SR then ratecard version display (the unique values are listed in enum object with priorities) such that 
            // Current is first, Working is second, Working Draft comes next, and finally Actual is at the bottom of the sort
            if (a.sellingRotationId > 0 && a.sellingRotationId === b.sellingRotationId) {
                // Sort Standalone SRs using status ratecard version
                // Numeric ratecardVersionDisplay should be listed after its corresponding "Working" or "Actual".
                if (Number(b.ratecardVersionDisplay) && ratecardVersionDisplaySortingEnum.hasOwnProperty(a.ratecardVersionDisplay)
                    && b.packageId === 0
                    && a.packageId === 0) {
                    return -1;
                }

                if (ratecardVersionDisplaySortingEnum.hasOwnProperty(a.ratecardVersionDisplay) &&
                    ratecardVersionDisplaySortingEnum.hasOwnProperty(b.ratecardVersionDisplay)) {
                    if (ratecardVersionDisplaySortingEnum[a.ratecardVersionDisplay] < ratecardVersionDisplaySortingEnum[b.ratecardVersionDisplay]) {
                        return 1;
                    }
                    if (ratecardVersionDisplaySortingEnum[a.ratecardVersionDisplay] > ratecardVersionDisplaySortingEnum[b.ratecardVersionDisplay]) {
                        return -1;
                    }
                }
            }

            // For Package sorting only
            if (a.ordinal === -1 && a.ordinal === b.ordinal) {
                if (ratecardVersionDisplaySortingEnum.hasOwnProperty(a.ratecardVersionDisplay) &&
                    ratecardVersionDisplaySortingEnum.hasOwnProperty(b.ratecardVersionDisplay)) {
                    if (ratecardVersionDisplaySortingEnum[a.ratecardVersionDisplay] < ratecardVersionDisplaySortingEnum[b.ratecardVersionDisplay]) {
                        return 1;
                    }
                    if (ratecardVersionDisplaySortingEnum[a.ratecardVersionDisplay] > ratecardVersionDisplaySortingEnum[b.ratecardVersionDisplay]) {
                        return -1;
                    }
                }
            }

            if (a.ordinal > b.ordinal) {
                return 1;
            }
            if (a.ordinal < b.ordinal) {
                return -1;
            }

            return 0;
        });

        return rows;
    };

    var sortByPricePeriodCriteria = (rows) => {
        // Sorting by pricePeriodName or pricePeriodStartDate
        rows.sort((a, b) => a.pricePeriodName < b.pricePeriodName || new Date(a.pricePeriodStartDate).getTime() < new Date(b.pricePeriodStartDate).getTime() ? -1 : 0);
        return rows;
    };

    var sortAndApplyOrdinalForPrimary = (packageGroupedRows) => {

        // Check packageGroupedRows are stand alone SRs
        const standAloneSr = !packageGroupedRows.some(p => p.sellingRotationId === 0);

        // Sort packageGroupedRows by sellingRotationId first
        packageGroupedRows.sort((a, b) => a.sellingRotationId - b.sellingRotationId);


        packageGroupedRows.forEach((packageGroupedRow) => {
            if (packageGroupedRow.primary) {
                packageGroupedRow.ordinal = 0;
            }
            else if (packageGroupedRow.sellingRotationId === 0) {
                packageGroupedRow.ordinal = -1;
            }
            // if SR does not include Grouping SR use negative sellingRotationId as ordinal
            else if (standAloneSr) {
                packageGroupedRow.ordinal = -1 * packageGroupedRow.sellingRotationId;
            }
            else {
                packageGroupedRow.ordinal = packageGroupedRow.sellingRotationId;
            }
        });

        // Get all negative ordinals for Stand alone SRs
        const rowsNonGroupingSr = packageGroupedRows.filter(r => {
            return (r.ordinal < -1);
        }
        );

        // Sort from highest to lowest negative ordinals
        const rowsNonGroupingSrSorted = rowsNonGroupingSr.sort((a, b) => b.ordinal - a.ordinal);

        // Get max ordinal from packageGroupedRows
        var maxOrdinal = Math.max(...packageGroupedRows.map(r => r.ordinal), 0);

        // Assign new ordinal based on max ordinal for those SRs with negative ordinal
        rowsNonGroupingSrSorted.forEach((packageGroupedRow) => {
            packageGroupedRow.ordinal = maxOrdinal + 1;
            maxOrdinal = packageGroupedRow.ordinal;
        });
    };

    // Takes a reduced object containing grouped P&E Grid Rows by Pkg Qtr Release and returns an array of objects with object key to custom sort by
    var convertGroupingObjectToPackageQuarterReleaseArrays = (groupedRows) => {
        var arrayToReturn = [];

        for (const property in groupedRows) {
            if (Object.prototype.hasOwnProperty.call(groupedRows, property)) {
                //create new key as an obj literal
                var propertyKeys = property.split('-');

                var objKey = {
                    packageId: propertyKeys[0],
                    quarter: propertyKeys[1],
                    release: propertyKeys[2]
                };

                // set sort order for primary then SR Id Ascending
                sortAndApplyOrdinalForPrimary(groupedRows[property]);

                sortGroupedGridRows(groupedRows[property]);

                sortByPricePeriodCriteria(groupedRows[property]);

                arrayToReturn.push({
                    key: objKey,
                    value: groupedRows[property]
                });
            }
        }
        return arrayToReturn;
    };

    var groupByPackageQuarterRelease = (accumulator, currentValue) => {
        var currentOrPreviousRelease = ratecardVersionDisplaySortingEnum[currentValue.ratecardVersionDisplay];

        // Anything that matches the enum means it is a current release and should be grouped together.
        // Standalone SRs with numeric ratecardVersion should be grouped also.
        if (typeof currentOrPreviousRelease !== 'undefined' || currentValue.packageId === 0) {
            currentOrPreviousRelease = currentKey;
        }
        // ratecardVersionDisplays that fall outside the dictionary and are numeric should be sorted to bottom.
        // This applies for Packages only, when ratecardVersion is numeric.
        else {
            currentOrPreviousRelease = `${currentValue.ratecardVersion}.${currentValue.ratecardRevision}`;
        }

        var quarter = currentValue.quarter.split('Q/');
        var newAccumulatorKey = `${currentValue.packageId}-${quarter[1]}${quarter[0]}-${currentOrPreviousRelease}`;

        if (typeof accumulator[newAccumulatorKey] === 'undefined') {
            accumulator[newAccumulatorKey] = [];
        }

        accumulator[newAccumulatorKey].push(currentValue);

        return accumulator;
    };

    var groupByPackageQuarter = (accumulator, currentValue) => {
        var quarter = currentValue.quarter.split('Q/');
        var newAccumulatorKey = `${currentValue.packageId}-${quarter[1]}${quarter[0]}`;

        if (typeof accumulator[newAccumulatorKey] === 'undefined') {
            accumulator[newAccumulatorKey] = [];
        }

        accumulator[newAccumulatorKey].push(currentValue);

        return accumulator;
    };

    var sortGroupedPackagesByPackageQuarterRelease = (rows) => {
        rows.sort(function (a, b) {
            if (a.key.packageId > b.key.packageId) {
                return 1;
            }
            if (a.key.packageId < b.key.packageId) {
                return -1;
            }
            if (a.key.quarter > b.key.quarter) {
                return 1;
            }
            if (a.key.quarter < b.key.quarter) {
                return -1;
            }
            // Sort release descending starting with current first (this is a composite key that will have either current or 300.00012), should go current, 300, 100 etc for the sort
            if (a.key.release > b.key.release) {
                return -1;
            }
            if (a.key.release < b.key.release) {
                return 1;
            }

            return 0;
        });
    };

    var moveCurrentRemovedGroupRowsToHighestPackageRatecardRelease = (rows, groupedRows) => {
        var currentRemovedRows = rows.filter(x => x.ratecardVersionDisplay === pricingEstimates.rowTypes.currentRemoved);

        if (typeof currentRemovedRows === 'undefined') {
            return groupedRows;
        }

        var newRowsToReturn = Object.assign(groupedRows);

        var latestReleasedKeys = Object.keys(newRowsToReturn).filter(x => !x.includes(currentKey));

        // get distinct by package quarter
        var currentRemovedPackageQuarter = currentRemovedRows.reduce(groupByPackageQuarter, {});

        //put the package quarter current removed SRs into the correct object by looking up the key
        var currentRemovedKeys = Object.keys(currentRemovedPackageQuarter);

        // for each quarter (need to get distinct quarters for the current removed)
        // get the highest version of the package it's associated with (group by that too)
        // for each currentRemovedKeys
        currentRemovedKeys.forEach(currentRemovedKey => {
            // key format 5850-20214-393.00005
            var latestReleaseForQuarter = latestReleasedKeys.filter(x => x.includes(currentRemovedKey)).map(x => x.split('-')[2])
                .sort((a, b) => b - a)[0];

            // in the case where there are current removed rows, and the other package quarter rows are current there is no work to be done
            if (typeof latestReleaseForQuarter === 'undefined') {
                return groupedRows;
            }

            var latestReleasedPackageKey = `${currentRemovedKey}-${latestReleaseForQuarter}`;
            var currentPackageKey = `${currentRemovedKey}-${currentKey}`;

            // add to this
            var recordsToAdd = currentRemovedPackageQuarter[currentRemovedKey];
            //"flat push" an array into another array
            newRowsToReturn[latestReleasedPackageKey].push.apply(newRowsToReturn[latestReleasedPackageKey], recordsToAdd);

            //remove the packages current removed associated with it - need to remove each SR current removed?
            var currentPackage = newRowsToReturn[currentPackageKey];
            var currentPackageLength = currentPackage.length;
            while (currentPackageLength--) {
                if (currentPackage[currentPackageLength].ratecardVersionDisplay === pricingEstimates.rowTypes.currentRemoved) {
                    currentPackage.splice(currentPackageLength, 1);
                }
            }
            if (newRowsToReturn[currentPackageKey].length === 0) {
                delete newRowsToReturn[currentPackageKey];
            }
        });

        return newRowsToReturn;
    };

    var sortGridRows = (rows) => {

        // Reduce the rows using a key of Package Quarter Release (natural grouping on the grid)
        // This will make it easier to differentiate between releases when sorting SR rows that are grouped under a package
        var rowsGroupedByPackageQuarterRelease = rows.reduce(groupByPackageQuarterRelease, {});

        // UAPRC-2184 If the Current (Removed) SR has not been released standalone it still shows linked to the package even though the RatecardRelease versions are considered different by the grouping logic
        // This brute force approach puts the Current (Removed) SRs that are still associated with the package back into the Package Quarter RatecardRelease Version
        // The RatecardRelease Version of the Package may not be considered Current since it has since been released, but the Standalone SR that has not been released yet sees it as the current 
        // release since it was not released standalone yet
        var rearrangedRows = moveCurrentRemovedGroupRowsToHighestPackageRatecardRelease
            (rows, rowsGroupedByPackageQuarterRelease);

        // Convert the reduced object into an array of arrays with distinct Package Quarter Release keys in order to allow for custom sorting
        var packagedQuarterReleases = convertGroupingObjectToPackageQuarterReleaseArrays(rearrangedRows);

        // Custom sorting for Release descending with the current release first
        sortGroupedPackagesByPackageQuarterRelease(packagedQuarterReleases);

        // Flatten the array of arrays back to the grid array that slick grid can process
        rows = packagedQuarterReleases.flatMap(arrayOfPackageQuarterRelease => arrayOfPackageQuarterRelease.value);

        return rows;
    };

    var getWorkingDraftEstimate = (estimate, workingDrafts) => {
        var workingDraftToReturn = workingDrafts.find(workingDraft =>
            workingDraft.SellingRotationId === estimate.SellingRotationId &&
            workingDraft.PackageId === estimate.PackageId &&
            workingDraft.Quarter.QuarterNumber === estimate.Quarter.QuarterNumber &&
            workingDraft.Quarter.Year === estimate.Quarter.Year &&
            workingDraft.DeliveryStream === estimate.DeliveryStream &&
            workingDraft.IsWorking === true
        );

        return workingDraftToReturn;
    };

    var convertEstimatesToGridRows = function (estimates) {

        var gridRows = [];

        let workingDrafts = estimates.filter(estimate => estimate.EstimateType === pricingEstimates.estimateTypes.released
            && estimate.RatecardReleaseId === null);

        estimates.forEach(function (estimate) {
            estimate.WorkingDraft = null;


            // find the released estimate's working draft (if it exists)
            let workingDraft = estimate.RatecardReleaseId === null || !estimate.IsCurrent
                ? null // the estimate *is* a working draft or it is not the current release
                : getWorkingDraftEstimate(estimate, workingDrafts);

            if (estimate.IsPackage) {
                if (estimate.EstimateType === pricingEstimates.estimateTypes.actual) {
                    gridRows.push(new viewModels.PricePeriodEstimate(estimate, pricingEstimates.rowTypes.packageActual));
                } else if (typeof estimate.RatecardReleaseId === 'number') {
                    gridRows.push(new viewModels.PricePeriodEstimate(estimate, pricingEstimates.rowTypes.package));
                } else {
                    // previously unreleased package quarters
                    gridRows.push(new viewModels.PricePeriodEstimate(estimate, pricingEstimates.rowTypes.packageWorking));
                }
            } else {
                let rowType = undefined;

                if (searchViewModel.IncludeWorkingRow() && estimate.IsCurrent && estimate.PackageId !== 0 && workingDraft == null) {
                    rowType = pricingEstimates.rowTypes.currentRemoved;
                }
                gridRows.push(new viewModels.PricePeriodEstimate(estimate, rowType));
            }
        });

        gridRows = streamIndex.calculateIndicesFor(gridRows);

        gridRows = sortGridRows(gridRows);

        return gridRows;
    };

    var isInitialized = function ($splitter) {
        return $splitter.data('kendoSplitter') !== undefined;
    }

    var getSourceEstimatesDataForAjax = function (sourceEstimates) {
        var data = [];

        sourceEstimates.forEach(function (sourceEstimate) {
            data.push(sourceEstimate.getDataForAjax());
        });

        return data;
    };

    var isValidExport = function (sourceLength, maxLength, type) {
        if (sourceLength > maxLength) {
            toastr.error('You are trying to export ' + sourceLength + ' ' + type + '. \n' +
                'The application is unable to export more than ' + maxLength + ' ' + type + ' at this time.');
            return false;
        }

        return true;
    };

    var loadEpisodeGrid = function (episodeGridResults, totalsRowResults, episodeGridHeaderData) {
        var $splitter = $('.splitter-content');
        var topPaneSelector = '.top-pane';
        var destroySplitter = function () {
            if (isInitialized($splitter)) {
                $splitter.adSalesSplitter('remove', '.k-pane.bottom-pane');
                $splitter.adSalesSplitter('remove', '.k-pane.bottom-two-grid-pane');
                $splitter.adSalesSplitter('destroy');
            }
        };

        var destroySplitterAndClearEpisodeGrid = function () {
            destroySplitter();
        };

        var exportSubGrid = function () {
            if (episodeGrid && episodeTotalsGrid) {
                var totalRow = episodeTotalsGrid.getExportRow(); //totals grid is different than episodeGrid
                var fileName = 'Episodes with Actuals Data SR-' +
                    episodeGridHeaderData.sellingRotationId + ' - ' +
                    episodeGridHeaderData.name + ' - ' +
                    episodeGridHeaderData.quarter;
                episodeGrid.exportToExcel(totalRow, fileName, isValidExport);
            }
        }

        var registerSplitterEventHandlers = function () {
            var resizeSplitter = function () {
                $splitter.adSalesSplitter('resize');
            };

            $splitter
                .off('click', '.close-sub-grid') // this will be called many times so reset it
                .on('click', '.close-sub-grid', destroySplitterAndClearEpisodeGrid);
            $splitter
                .off('click', '.export-sub-grid') // this will be called many times so reset it
                .on('click', '.export-sub-grid', exportSubGrid);

            $.EventBus(adSalesSplitterEvents.resizeSplitter).subscribe(resizeSplitter);
            $.EventBus(adSalesSplitterEvents.destroySplitter).subscribe(destroySplitter);
        };

        // destroy any existing
        destroySplitter();

        // dynamically insert the bottom pane, along with the div that will become the episodes grid.
        $(['<div class="bottom-two-grid-pane">',
            '<div class="ad-ratecard-grid-index-header">',
            '<h2 class="episodeGridHeaderStaticText">Episodes:</h2>',
            '<h2 class="episodeGridHeaderDynamicText">' + episodeGridHeaderData.sellingRotationId + ' - ' + episodeGridHeaderData.name + ' - ' + episodeGridHeaderData.quarter + ' - ' + episodeGridHeaderData.ratecardVersionDisplay + '</h2>',
            '<div class="ad-ratecard-grid-index-header-right">',
            '<button id="exportToExcelButton2" class="export-sub-grid" data-bind="attr: { title: exportRowsTooltip}" title="Export To Excel"></button>',
            '<div class="close-sub-grid"></div>',
            '</div>',
            '</div>',
            '<div class="ad-ratecard-sub-grid"></div>',
            '<div class="bottom-two-grid-pane sticky-wrapper">',
            '<div class="ad-ratecard-sub-totals-grid"></div>',
            '</div>',
            '</div>'

        ].join('')).insertAfter($splitter.find(topPaneSelector));

        var grid = episodeGrid.initialize({
            gridSelector: '.ad-ratecard-sub-grid',
            initializationData: episodeGridResults,
            scrollWith: $('.ad-ratecard-grid').find('.slick-viewport-top.slick-viewport-right')
        });

        var totalsGrid = episodeTotalsGrid.initialize({
            gridSelector: '.ad-ratecard-sub-totals-grid',
            initializationData: totalsRowResults,
            totalEpisodeCount: (_.filter(episodeGridResults, function (o) { return o.deliveryStream === "PL"; })).length,
            scrollWith: $('.ad-ratecard-grid').find('.slick-viewport-top.slick-viewport-right')
        });

        // adjust height to accomodate totals grid row vertical scroll region.
        if (_.filter(grid.getData().getItems(), { 'deliveryStream': 'C3' }).length >= 7) {
            $('.splitter-content .bottom-two-grid-pane .ad-ratecard-sub-totals-grid').height(35);
        }

        $splitter.adSalesSplitter({
            resize: function () {
                // resize both P&E grid and episode grid.
                resizePricingEstimatesGrid(topPaneSelector);
                grid.resizeCanvas();
                totalsGrid.resizeCanvas();
            }
        });

        registerSplitterEventHandlers();
        // resize P&E grid after initializing splitter (which apparently happens synchronously)
        resizePricingEstimatesGrid(topPaneSelector);
    };
    var getEpisodeGridHeaderData = function (sourceEstimates) {
        return {
            name: sourceEstimates[0].name,
            sellingRotationId: sourceEstimates[0].sellingRotationId,
            ratecardVersionDisplay: sourceEstimates[0].ratecardVersionDisplay,
            ratecardVersion: sourceEstimates[0].ratecardVersion,
            quarter: sourceEstimates[0].quarter
        };
    };

    var getEpisodeGridAPI = function (sourceEstimates) {
        if (sourceEstimates[0].rowType === "Actual") {
            return "GetActualsEpisodes";
        }

        return "GetForecastedEpisodes";
    };

    var processForecastedEpisodeDataResults = function (results, episodeGridHeaderData) {
        if (results.length === 0) {
            toastr.info(noEpisodeLevelEstimatesmessage);
        } else {
            var rows = [];
            var currentStream = "";
            var currentEntityId = 0;

            results.forEach(function (dto) {
                // Reset the entity Id per stream for the caluclation of indices.
                if (currentStream !== dto.DeliveryStream) {
                    currentStream = dto.DeliveryStream;
                    currentEntityId = 1;
                }

                var viewModel = new viewModels.PricePeriodEstimate(dto);

                viewModel.entityId = currentEntityId;
                viewModel.startTime = dto.StartTime;
                viewModel.duration = dto.Duration;
                viewModel.airDate = dto.AirDate;
                viewModel.episodeDay = dto.EpisodeDay;
                viewModel.episodeTitle = dto.EpisodeTitle;
                viewModel.episodeId = dto.EpisodeId;
                viewModel.repeatNumber = dto.RepeatNumber;
                viewModel.programNumber = dto.ProgramNumber;
                viewModel.programCode = dto.ProgramCode;
                viewModel.isTotalsRow = dto.IsTotalsRow;
                rows.push(viewModel);
                currentEntityId++;
            });

            rows = streamIndex.calculateIndicesFor(rows);
            loadEpisodeGrid(_.filter(rows, function (o) { return !o.isTotalsRow; }), _.filter(rows, function (o) { return o.isTotalsRow; }), episodeGridHeaderData);
        }
    };

    var getForecastedEpisodeData = function (sourceEstimates) {
        var episodeGridHeaderData = getEpisodeGridHeaderData(sourceEstimates);

        rateCard.ajax({
            url: rateCard.applicationUrl + '/api/pricingEstimates/' + getEpisodeGridAPI(sourceEstimates),
            data: JSON.stringify(getSourceEstimatesDataForAjax(sourceEstimates)),
            type: 'POST',
            done: function (results) {
                processForecastedEpisodeDataResults(results, episodeGridHeaderData);
            },
            validationFail: function (jqXHR) {
                deferred.reject();
                toastr.error(JSON.parse(jqXHR.responseText)[0]);
            }
        });
    };

    var showEpisodeGrid = function () {
        //  First, get selected row.
        var selectedPricePeriodEstimate = _.filter(grid.getData().getItems(), function (pricePeriodEstimate) { return pricePeriodEstimate.selected; })[0];
        // Now, get the matching SR\QTRs in all other streams.
        var otherPricePeriodEstimate = _.filter(grid.getData().getItems(), function (pricePeriodEstimate) {
            return (pricePeriodEstimate.sellingRotationId === selectedPricePeriodEstimate.sellingRotationId &&
                pricePeriodEstimate.quarter === selectedPricePeriodEstimate.quarter &&
                pricePeriodEstimate.rowType === selectedPricePeriodEstimate.rowType &&
                pricePeriodEstimate.ratecardVersionDisplay === selectedPricePeriodEstimate.ratecardVersionDisplay &&
                pricePeriodEstimate.deliveryStream !== selectedPricePeriodEstimate.deliveryStream);
        });

        var sourceEstimates = [];

        sourceEstimates.push(selectedPricePeriodEstimate);
        otherPricePeriodEstimate.forEach(function (pricePeriodEstimate) {
            sourceEstimates.push(pricePeriodEstimate);
        });

        getForecastedEpisodeData(sourceEstimates);
    };
    var showIndexGrid = function () {
        var indexModal = this;
        var indexGrid;
        var $splitter = $('.splitter-content');
        var topPaneSelector = '.top-pane';
        var destroySplitter = function () {
            if (isInitialized($splitter)) {
                $splitter.adSalesSplitter('remove', '.k-pane.bottom-pane');
                $splitter.adSalesSplitter('remove', '.k-pane.bottom-two-grid-pane');
                $splitter.adSalesSplitter('destroy');
            }
        };
        var destroySplitterAndClearIndexSelection = function () {
            destroySplitter();
            indexRowsViewModel.clear();
        };
        var registerSplitterEventHandlers = function () {
            var resizeSplitter = function () {
                $splitter.adSalesSplitter('resize');
            };
            var indexExportButton = $('#indexExportButton');

            $splitter
                .off('click', '.close-sub-grid') // this will be called many times so reset it
                .on('click', '.close-sub-grid', destroySplitterAndClearIndexSelection);

            indexExportButton.on('click', function () {
                var gridData = _.where(indexGrid.getData().getItems(), { 'visible': true });
                var gridColumns = indexGrid.getColumns();
                var length = gridColumns.length;
                var maxColumns = 255;
                var diff = length - maxColumns;

                if (length > maxColumns) {
                    toastr.error('You are trying to export ' + length + ' columns. \n' +
                        'The application is unable to export more than ' + maxColumns + ' columns at this time. \n' +
                        'Please hide at least ' + diff + ' column(s) to enable the export.');
                    return;
                }

                slickGridCommon.export('Index Grid Export ' + toolbarViewModel.selectedDeliveryStream(), 'IndexGridExport', gridData, gridColumns);
            });

            $.EventBus(adSalesSplitterEvents.resizeSplitter).subscribe(resizeSplitter);
            $.EventBus(adSalesSplitterEvents.destroySplitter).subscribe(destroySplitter);
        };

        // destroy any existing
        destroySplitter();

        // dynamically insert the bottom pane, along with the div that will become the index grid
        $(['<div class="bottom-pane">',
            '<div class="ad-ratecard-grid-index-header">',
            '<h2>Index</h2>',
            '<div class="ad-ratecard-grid-index-header-right">',
            '<div class="index-header-left">',
            '<button id="indexExportButton" class="rc-toolbar-estimate-export-icon" title="Export To Excel"></button>',
            '</div>',
            '<div class="close-sub-grid"></div>',
            '</div>',
            '</div>',
            '<div class="ad-ratecard-sub-grid"></div>',
            '</div>'
        ].join('')).insertAfter($splitter.find(topPaneSelector));

        indexGrid = estimateIndexGrid.initialize({
            gridSelector: '.ad-ratecard-sub-grid',
            initializationData: generateIndexGridDto(),
            scrollWith: $('.ad-ratecard-grid').find('.slick-viewport-top.slick-viewport-right')
        });

        $splitter.adSalesSplitter({
            resize: function () {
                // resize both P&E grid and index grid
                resizePricingEstimatesGrid(topPaneSelector);
                indexGrid.resizeCanvas();
            }
        });

        registerSplitterEventHandlers();

        // resize P&E grid after initializing splitter (which apparently happens synchronously)
        resizePricingEstimatesGrid(topPaneSelector);

        // close index set chooser
        indexModal.destroy();
    };
    var registerEventHandlers = function () {
        var resizeGrids = function () {
            //TODO: Find a cleaner way to do this.  Basically - if the splitter is initialized, resize via the event, otherwise resize according to the main content height
            if ($('.bottom-pane').length > 0) {
                $.EventBus(adSalesSplitterEvents.resizeSplitter).publish();
            } else {
                resizePricingEstimatesGrid(mainContent);
            }
        };

        $('#saveEstimates').on('click', function () {
            Slick.GlobalEditorLock.commitCurrentEdit(); //forces grid events to fire if needed https://stackoverflow.com/a/15513516
            saveEstimates.save({
                grid: grid,
                unsavedChangesViewModel: unsavedChangesViewModel,
                afterSave: function () {
                    toolbarViewModel.unsavedRows(unsavedChangesViewModel.unsavedIds());
                    toolbarViewModel.lockAdjustOtherStreams(false);
                    toolbarViewModel.adjustOtherStreams(true);
                }
            });
        });

        $('#discardEstimates').on('click',
            function () {
                search();
            });

        //if user has edits in a cell and then tries to uncheck, cell change is made in original state
        $('#maintain-indexes').on('click',
            function () {
                Slick.GlobalEditorLock.commitCurrentEdit(); //forces grid events to fire if needed https://stackoverflow.com/a/15513516
            });

        adjustEstimatesButton.on('click', function () {
            var options = {
                title: 'Adjust',
                activate: function () {
                    estimateAdjustmentViewModel.setColumns(_.unique(_.pluck(grid.getColumns(), 'demoCode')));
                    ko.applyBindings(estimateAdjustmentViewModel, this.element[0]);
                },
                width: '350px',
                buttons: [
                    {
                        text: 'Cancel',
                        type: 'secondaryLink',
                        click: function () {
                            estimateAdjustmentViewModel.reset();
                            this.destroy();
                        }
                    },
                    {
                        text: 'Apply',
                        type: 'primaryButton',
                        click: function () {
                            var windowInstance = this;
                            var rowsToAdjust = slickGridCommon.getSelectedRowItems(grid);

                            windowInstance.showMask();

                            $.whenAll(estimateAdjustmentViewModel.applyAdjustments(rowsToAdjust)).then(function (results) {
                                results.forEach(function (updatedStreams) {
                                    updatedStreams.forEach(function (updatedRow) {
                                        updateEstimate(updatedRow);
                                    });
                                });

                                toastr.success('Adjustment calculations complete');

                                estimateAdjustmentViewModel.reset();

                                windowInstance.destroy();
                            });
                        },
                        dataBind: 'enable: canApplyAdjustments'
                    }
                ]
            };

            $('.adjustEstimatesWindow')
                .clone()
                .removeClass('hidden')
                .adSalesWindow(options)
                .center()
                .open();
        });

        copyEstimatesButton.on('click', function () {
            copyEstimates();
        });

        pasteEstimatesButton.on('click', function () {
            var estimatesToCopy = slickGridCommon.getSelectedRowItems(grid);

            copyPricingEstimate.paste(estimatesToCopy, grid).then(function (results) {
                results.forEach(function (updatedStreams) {
                    updatedStreams.forEach(function (updatedRow) {
                        updateEstimate(updatedRow);
                    });
                });

                var packagesToRefresh = _.filter(_.groupBy(estimatesToCopy, 'packageId'), function (d) { return d[0]; });
                packagesToRefresh.forEach(function (p) {
                    refreshPackageWorkingRow(grid, p[0].entityId, p[0].deliveryStream).then(function (results) {
                        results.forEach(function (updatedRow) {
                            updateEstimate(updatedRow);
                        });
                    });
                });

                toastr.success('Estimate successfully copied');
            });
        });

        var refreshPackageWorkingRow = function (grid, entityId, deliveryStream) {
            return rateCard.ajax({
                url: rateCard.applicationUrl + '/api/pricingEstimates/calculate/rate/',
                data: JSON.stringify({
                    OriginatingStream: deliveryStream,
                    OriginatingId: entityId,
                    estimates: Slick.Data.getAffectedEstimates(grid, entityId).map(function (estimate) {
                        return estimate.getDataForAjax();
                    })
                })
            });
        };

        $(window).resize(resizeGrids);

        mainContent.on('transitionend', resizeGrids);

        adjustDemosButton.on('click', function () {
            $("#demosAdjustingTool").adjustDemosViewForm();
        });

        staticColumnDropdownButton.on('click', function () {
            $('#staticColumnDropdownButton').staticColumnDropdown({
                anchorElement: this
            });
        });


        deliveryStreamDropdown.on('change', function () {
            var dropdownValue = this.value;

            if (!grid) {
                return;
            }
            Slick.GlobalEditorLock.commitCurrentEdit(); //forces grid events to fire if needed https://stackoverflow.com/a/15513516
            if (dropdownValue === pricingEstimates.deliveryStreams.NR) {
                toolbarViewModel.showStreamIndices(false);
            }

            $.EventBus(filterEvents.clearFilter).publish();
            $.EventBus(filterEvents.applyFilter).publish('deliveryStream', dropdownValue);
            $.EventBus(rateCard.customEvents.deliveryStreamChanged).publish(dropdownValue);



            if (dropdownValue === pricingEstimates.deliveryStreams.NR) {
                pricingEstimatesGridColumns.hideMetricColumns();
            }
            else {
                pricingEstimatesGridColumns.showMetricColumns();
            }

            if (toolbarViewModel.showStreamIndices()) {
                pricingEstimatesGridColumns.showIndexColumns(toolbarViewModel.showStreamIndices, dropdownValue, _.pluck(toolbarViewModel.availableDeliveryStreams(), "Name"));
            }


            // ensure that all packages are expanded
            forceExpandAll();

            saveUserSettings(dropdownValue);
        });

        releaseRateCardButton.on('click', function () {
            var selectedRows = slickGridCommon.getSelectedRowItems(grid);
            var selectedEstimates = [];

            selectedRows.forEach(function (rowItem) {
                if (rowItem.rowType === pricingEstimates.rowTypes.draft) {
                    _.filter(Slick.Data.getAffectedEstimates(grid, rowItem.entityId), function (row) {
                        if (row.isWorking()) {
                            selectedEstimates.push(row);
                        }
                    });
                }
            });

            var rowsToRelease = _.uniq(selectedEstimates, 'entityId')
                .map(function (row) {
                    return row.getDataForRelease();
                });

            if (rowsToRelease.length > 0) {
                var commentsOptions = {
                    title: 'Release Ratecard',
                    activate: function () {
                        $('#releaseComments', this.element[0]).focus();
                    },
                    open: function () {
                        ko.applyBindings(releaseRateCardViewModel, this.element[0]);
                    },
                    width: '350px',
                    buttons: [
                        {
                            text: 'Cancel',
                            type: 'secondaryLink',
                            click: function () {
                                releaseRateCardViewModel.reset();
                                this.destroy();
                            }
                        },
                        {
                            text: 'Release',
                            type: 'primaryButton',
                            click: function () {
                                this.destroy();
                                releaseRatecard.initialize(rowsToRelease, searchViewModel, releaseRateCardViewModel);
                            },
                            dataBind: 'enable: enableRelease'
                        }
                    ]
                };
                getCurrentRatecardVersionRevision().then(function (ratecard) {
                    var version = ratecard.Version;
                    var revision = parseInt(ratecard.Revision, 10) + 1;
                    releaseRateCardViewModel.ratecardVersion(ratecard.Version);
                    releaseRateCardViewModel.ratecardRevision(ratecard.Revision);
                    releaseRateCardViewModel.releaseVersion(`${version}.${rateCard.utils.padString(revision.toString(), 5, '0', true)}`);

                    $('.releaseCommentsWindow')
                        .clone()
                        .removeClass('hidden')
                        .adSalesWindow(commentsOptions)
                        .center()
                        .open();
                });
            }
            else {
                toastr.error("Release is only valid for Working (Draft) rows.");
            }
        });

        vphByBaseDemoButton.on('click', function () {
            $("#vphBreakOutWindow").vphBreakOutWindow({
                pricePeriod: slickGridCommon.getSelectedRowItems(grid)[0],
                grid: grid,
                gridUpdateCallBack: updateEstimate
            });
        });

        showSelectedRowsCheckbox.rateCardSelectedRows();

        indexRowsButton.on('click', openIndexGridModal);

        episodeGridButton.on('click', showEpisodeGrid);

        deleteRowsButton.on('click', function () {
            if (confirm('Working (Draft) rows with saved edits will be deleted. This cannot be undone. Working rows will be available to make new changes. Do you want to continue?')) {
                var idsToDelete = _.pluck(slickGridCommon.getSelectedRowItems(grid), 'entityId');
                var rowsToDelete = _.uniq(grid.getData().getItems()
                    .filter(function (row) {
                        var indexExists = idsToDelete.indexOf(row.entityId) !== -1;
                        return indexExists && row.rowType === pricingEstimates.rowTypes.draft;
                    }), 'entityId')
                    .map(function (row) {
                        return row.getDataForRelease();
                    });

                if (rowsToDelete.length > 0) {
                    rateCard.ajax({
                        url: rateCard.applicationUrl + '/api/pricingEstimates/deleteDraftEstimates',
                        type: 'DELETE',
                        data: JSON.stringify(rowsToDelete)
                    }).then(function (deletedRows) {
                        var failedRows = [];
                        var updateDeletedRow = function (deletedRow) {
                            if (!deletedRow.IsValid) {
                                failedRows.push(deletedRow.SellingRotationId.toString() + ' ' + deletedRow.Quarter.QuarterNumber + "Q/" + deletedRow.Quarter.Year);
                                return;
                            }

                            var estimateRows = _.filter(grid.getData().getItems(), function (row) {
                                return row.entityId === deletedRow.Id;
                            });

                            estimateRows.forEach(function (row) {
                                var idOfRowToDelete = row.id;
                                var currentReleasedRow = getCurrentReleasedRow(row);
                                var workingRow = currentReleasedRow[0].clone();
                                if (workingRow) {
                                    var indexOfRowToDelete = grid.getData().getIdxById(idOfRowToDelete);
                                    grid.getData().deleteItem(idOfRowToDelete);
                                    workingRow.updateAfterDelete();
                                    grid.getData().insertItem(indexOfRowToDelete, workingRow);
                                }
                            });

                            // remove the working draft row ID from the unsaved changes collection (both grid and toolbar VMs)
                            toolbarViewModel.unsavedRows.remove(deletedRow.Id);
                            unsavedChangesViewModel.unsavedIds.remove(deletedRow.Id);
                        };

                        deletedRows.forEach(updateDeletedRow);
                        if (failedRows.length > 0) {
                            var failedMessage = $('<div></div>');
                            failedMessage.append($('<span></span>').text('Working (Draft) rows for SR(s) ' + failedRows.join(', ') + ' could not be deleted for one of the following reasons: '));
                            failedMessage.append($('<br/><ul class="rc-error-toast-list"><li>Working (Draft) has been deleted in another session</li><li>Working (Draft) has been released in another session</li></ul>'));
                            toastr.error(failedMessage, null, { showAsHtml: true });
                        }
                        pricingEstimatesGridFilterBuilder.initialize(grid);
                    });
                }

            }
        });

        uploadButton.on('click', function () {
            uploadEstimates.openFileSelector();
        });

        rolloverButton.on('click', function () {
            var selectedRows = slickGridCommon.getSelectedRowItems(grid);
            var selectedQuarters = _.uniq(_.pluck(selectedRows, 'quarter'));
            var sourceQtrs = _.filter(_.pluck(allQtrs, 'Text'), function (q) {
                return q.compareQuarter(currQtr) < 0;
            });
            var sourceVphQtrs = _.filter(_.pluck(allQtrs, 'Text'), function (q) {
                return q.compareQuarter(currQtr) < 0;
            });
            rolloverEstimatesViewModel.sourceQuarters(sourceQtrs.reverse());
            rolloverEstimatesViewModel.targetQuarters(selectedQuarters);
            rolloverEstimates.open(rolloverEstimatesViewModel, selectedRows);
        });

        exportToExcelButton.on('click', function () {
            var gridColumns = grid.getColumns();
            var columnsLength = gridColumns.length;
            var maxColumns = 255;

            if (!isValidExport(columnsLength, maxColumns, 'columns')) {
                return;
            }

            var gridData = _.where(grid.getData().getItems(), { 'visible': true });
            var rowsLength = gridData.length;
            var maxRows = 100;

            if (!isValidExport(rowsLength, maxRows, 'rows')) {
                return;
            }

            slickGridCommon.export('Pricing and Estimates Export ' + toolbarViewModel.selectedDeliveryStream(), 'PricingAndEstimatesExport', gridData, gridColumns);
        });

        $.EventBus(searchEvents.loadSearch).subscribe(function (savedSearchJson) {
            searchViewModel.hydrate(savedSearchJson);
        });

        $.EventBus(searchEvents.collapse).subscribe(function () {
            mainContent.addClass('main-content-expanded');
        });

        $.EventBus(searchEvents.expand).subscribe(function () {
            mainContent.removeClass('main-content-expanded');
        });

        $.EventBus(rateCard.customEvents.rolloverComplete).subscribe(search);
    };
    var resizePricingEstimatesGrid = function (closest) {
        if (typeof grid === 'undefined') {
            // don't bother trying to resize the grid if it has not been created yet
            return;
        }

        var $pricingEstimatesGrid = $('.ad-ratecard-grid');
        var offset = 54; // 54 pixel offset for the margins and save/undo/redo buttons
        var heightToSetGrid = $pricingEstimatesGrid.closest(closest).height() - offset;

        $pricingEstimatesGrid.height(heightToSetGrid);

        grid.resizeCanvas();
    };
    var search = function () {
        $.EventBus(adSalesSplitterEvents.destroySplitter).publish();
        clearGrid();

        // show a blue toast saying that the search could take some time
        toastr.info('Your Search request is processing.', '', {
            timeOut: 0,
            extendedTimeOut: 0,
            tapToDismiss: false
        });

        populateGrid();
    };
    var selectedRowsHaveOrphanedRows = function () {
        var selectedRows = slickGridCommon.getSelectedRowItems(grid);
        var releasedRows = _.filter(selectedRows, function (row) {
            return getCurrentReleasedRow(row).length === 0;
        });
        return releasedRows.length !== 0;
    };
    var setIncludeOta = function (gridRows) {
        var anyDemoOnAnyRowHasOta = _.some(gridRows, function (row) {
            return row.hasOta();
        });

        if (anyDemoOnAnyRowHasOta) {
            toolbarViewModel.includeOta('yes');
        } else {
            toolbarViewModel.includeOta('no');
        }
    };
    var showSourceColumn = function (rows) {
        var anyRowHasSource = _.some(rows, function (row) {
            return row.sourceType !== '';
        });

        if (anyRowHasSource) {
            pricingEstimatesGridColumns.show(['sourceType'], pricingEstimates.columnTypes.static);
            pricingEstimatesGridColumns.applyChanges();
        }
    };
    var updateEstimate = function (updatedRow) {
        var oldRow = _.find(grid.getData().getItems(), function (row) {
            return row.entityId === updatedRow.Id &&
                row.deliveryStream === updatedRow.DeliveryStream &&
                row.isPackage === updatedRow.IsPackage &&
                (row.isWorking() || row.rowType === pricingEstimates.rowTypes.packageWorking);
        });
        var updateGridRow = function (rowIndex, rowItem) {
            grid.getData().updateItem(rowItem.id, rowItem);
            grid.invalidateRows([rowIndex]);
            grid.render();

            $.EventBus(rateCard.customGridEvents.onRowUpdated).publish(rowItem);
        };

        // propagate the row type from the grid row that was just updated
        var updatedEstimate = new viewModels.PricePeriodEstimate(updatedRow, oldRow.rowType);

        // every time an estimate is updated, recalculate the stream indices for that estimates streams
        streamIndex.calculateIndicesFor([updatedEstimate].concat(_.filter(grid.getData().getItems(), function (row) {
            return row.entityId === updatedEstimate.entityId && row.deliveryStream !== updatedEstimate.deliveryStream && row.rowType === updatedEstimate.rowType;
        }))).forEach(function (e) {
            updateGridRow(grid.getData().getIdxById(e.id), e);
        });

        // all the other stuff that has to happen when rows update
        unsavedChangesViewModel.add(updatedEstimate.entityId);

        toolbarViewModel.selectedRows(slickGridCommon.getSelectedRowItems(grid));
        toolbarViewModel.unsavedRows(unsavedChangesViewModel.unsavedIds());

        pricingEstimatesGridFilterBuilder.apply();
    };

    var userSettingsURL = function () {

        // Frame the user settings api url based on the last parameter of the P&E grid url
        var currentUrl = window.location.href;
        var urlParameters = currentUrl.split("/");
        var lastUrlParameterIndex = urlParameters.length - 1;
        var api;
        if (urlParameters[lastUrlParameterIndex] === undefined ||
            urlParameters[lastUrlParameterIndex] === null ||
            urlParameters[lastUrlParameterIndex] === "" ||
            urlParameters[lastUrlParameterIndex] === "#") {
            api = new ese.personalization.UserSettings("../api");
        }
        else {
            api = new ese.personalization.UserSettings("api");
        }
        return api;
    };

    //saving the grid settings by the user using proxy api.
    var saveUserSettings = function (selectedDeliveryStream) {
        var saveUserGridSettings;
        var deliveryStream;
        var adjustDemosViewModel = new viewModels.AdjustDemosViewModel();

        //saving the selected values of the controls in the header. 
        var selectedStaticColumns = pricingEstimatesGridColumns.getShowing(pricingEstimates.columnTypes.static);
        var index = toolbarViewModel.showStreamIndices();
        var includeOTA = toolbarViewModel.includeOta();


        if (selectedDeliveryStream !== "") {
            deliveryStream = selectedDeliveryStream;
        }
        else {
            deliveryStream = toolbarViewModel.selectedDeliveryStream();
        }

        var adjustOtherStreams = toolbarViewModel.adjustOtherStreams();
        var showingMetrics = adjustDemosViewModel.selectedMetrics();
        var availableMetrics = _.pluck(adjustDemosViewModel.availableMetrics(), 'metricType');
        var hiddenMetrics = _.difference(availableMetrics, showingMetrics);
        var showingDemos = _.pluck(adjustDemosViewModel.showingDemos(), 'code');

        saveUserGridSettings = {
            "Columns": selectedStaticColumns, "includeOTA": includeOTA, "index": index,
            "deliveryStream": deliveryStream, "adjustOtherStreams": adjustOtherStreams,
            "showingMetrics": showingMetrics, "hiddenMetrics": hiddenMetrics,
            "showingDemos": showingDemos
        }

        var settings = saveUserGridSettings;
        settings = JSON.stringify(settings);
        var api = userSettingsURL();

        var serializedSettings = (settings && typeof (settings) !== 'string') ? JSON.stringify(settings) : settings;
        var objCode = "ADVSR_RTCRD_PE_GRID";

        // Call the save user settings function of personalization client proxy
        api.saveUserSettings(objCode, serializedSettings)
            .then(function () {
                return true;
            })
            .catch(function () {
                return false;
            });

        return serializedSettings;

    };

    //Initialization of confirmation popup
    var confirmWindow = $('#confirmWindow');

    confirmWindow.kendoWindow({
        modal: true,
        visible: false
    });

    //applying the defaults for the grid.
    var resetUserSettings = function () {

        pricingEstimatesGridColumns.hideInitialColumns();
        defaultActiveColumnForSaticColumns();

        defaultValueOfDeliveryStreamDropdown();
        //trigger the drop down event, so that we can bring it to default
        deliveryStreamDropdown.trigger("chosen:updated");
        deliveryStreamDropdown.trigger('change');
        defaultValueForCheckboxesInHeader();

        setIncludeOta(gridRows);

        //removing the saved settings by the user using proxy api.
        var api = userSettingsURL();
        var objCode = "ADVSR_RTCRD_PE_GRID";

        return api.resetUserSettings(objCode);

    };

    $(initialize);

    var testingOnly = {
        initialize,
        convertEstimatesToGridRows,
        gridRows,
        shouldShowWorkingRow,
        getGridData,
        pricingEstimateSearch,
        sortGridRows,
        displayToastErrorMessage,
        getWorkingDraftEstimate,
        initializeRatecardIdDropdown,
        sortByPricePeriodCriteria,
        getReleaseRatecardViewModel: () => {
            return releaseRateCardViewModel;
        },
        getSearchViewModel: () => {
            return searchViewModel;
        },
        setSearchViewModel: param => {
            searchViewModel = param;
        },
        initializeSellingRotationsDropdown,
        initializePackageDropdown,
        initializeDeliveryStreamDropdown,
        initializeCategorySubcategoryDropdown,
        initializeProgramCategoriesAndCodesDropdown,
        getRolloverEstimatesViewModel: () => {
            return releaseRateCardViewModel;
        },
        setRolloverEstimatesViewModel: param => {
            rolloverEstimatesViewModel = param;
        },
        initializeRolloverButton,
        getToolbarViewModel: () => {
            return toolbarViewModel;
        },
        setToolbarViewModel: param => {
            toolbarViewModel = param;
        }
    };

    testingOnly.override = {
        initialize: (newVal) => initialize = newVal,
        convertEstimatesToGridRows: (newVal) => convertEstimatesToGridRows = newVal,
        gridRows: (newVal) => gridRows = newVal,
        searchViewModel: (newVal) => searchViewModel = newVal,
        shouldShowWorkingRow: (newVal) => shouldShowWorkingRow = newVal,
        getGridData: (newVal) => getGridData = newVal,
        pricingEstimateSearch: (newVal) => pricingEstimateSearch = newVal,
        sortGridRows: (newVal) => sortGridRows = newVal,
        displayToastErrorMessage: (newVal) => displayToastErrorMessage = newVal,
        getWorkingDraftEstimate: (newVal) => getWorkingDraftEstimate = newVal,
        initializeRatecardIdDropdown: (newVal) => initializeRatecardIdDropdown = newVal,
        getReleaseRatecardViewModel: (newVal) => testingOnly.getReleaseRatecardViewModel = newVal,
        getSearchViewModel: (newVal) => testingOnly.getSearchViewModel = newVal,
        setSearchViewModel: (newVal) => testingOnly.setSearchViewModel = newVal,
        initializeSellingRotationsDropdown: (newVal) => initializeSellingRotationsDropdown = newVal,
        initializePackageDropdown: (newVal) => initializePackageDropdown = newVal,
        initializeDeliveryStreamDropdown: (newVal) => initializeDeliveryStreamDropdown = newVal,
        initializeCategorySubcategoryDropdown: (newVal) => initializeCategorySubcategoryDropdown = newVal,
        initializeProgramCategoriesAndCodesDropdown: (newVal) => initializeProgramCategoriesAndCodesDropdown = newVal,
        getRolloverEstimatesViewModel: (newVal) => testingOnly.getRolloverEstimatesViewModel = newVal,
        setRolloverEstimatesViewModel: (newVal) => testingOnly.setRolloverEstimatesViewModel = newVal,
        initializeRolloverButton: (newVal) => initializeRolloverButton = newVal,
        getToolbarViewModel: (newVal) => testingOnly.getToolbarViewModel = newVal,
        setToolbarViewModel: (newVal) => testingOnly.setToolbarViewModel = newVal,
        sortByPricePeriodCriteria : (newVal) => sortByPricePeriodCriteria = newVal
    };

    testingOnly.restore = (memberName) => {
        let memberNames = Object.getOwnPropertyNames(testingOnly)
            .filter(name => name !== 'override' && name !== 'restore');

        if (memberName) {
            memberNames = [memberName];
        }

        memberNames.forEach(name => {
            const originalValue = testingOnly[name];
            testingOnly.override[name](originalValue);
        });
    };

    return {
        resetUserSettings: resetUserSettings,
        saveUserSettings: saveUserSettings,
        getCurrentRatecardVersionRevisions: function () {
            return currentRatecardVersionRevisions;
        },
        populateCurrentRatecardVersionRevisions: populateCurrentRatecardVersionRevisions,
        testingOnly
    };
}(jQuery, _, authorization, ko, rateCard, pricingEstimates, pricingEstimatesGridColumns, saveEstimates, copyPricingEstimate, estimateIndexGrid, episodeGrid, episodeTotalsGrid,
    streamIndex, pricingEstimatesGridFilterBuilder, uploadEstimates, rolloverEstimates, slickGridCommon));