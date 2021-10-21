/* global testHelpers, it, expect, beforeAll, beforeEach, afterAll, afterEach */

describe('PricingEstimatesGrid tests suite', () => {
    var searchViewModel;
    var rolloverEstimatesViewModel;
    var toolbarViewModel;

    beforeEach(() => {
        searchViewModel = pricingEstimatesGrid.testingOnly.getSearchViewModel();
        rolloverEstimatesViewModel = pricingEstimatesGrid.testingOnly.getRolloverEstimatesViewModel();
        toolbarViewModel = pricingEstimatesGrid.testingOnly.getToolbarViewModel();
    });

    afterEach(() => {
        sinon.restore();
        window.pricingEstimatesGrid.testingOnly.restore();
        document.getElementById('RatecardId').innerHTML = '';
        pricingEstimatesGrid.testingOnly.setSearchViewModel(searchViewModel);
        pricingEstimatesGrid.testingOnly.setRolloverEstimatesViewModel(rolloverEstimatesViewModel);
        pricingEstimatesGrid.testingOnly.setToolbarViewModel(toolbarViewModel);
    });


    afterAll(() => {
        $('*[data-fixture=pricing-estimates-grid-test-element]').remove();
    });

    it('displayToastErrorMessage will create dialog for 400', () => {
        // arrange
        const error = {
            body: {
                status: 400,
                content:
                {
                    Conditions: [{ Message: 'a' }, { Message: 'b' }]
                }
            }
        };

        const fakeError = sinon.stub().returnsThis();
        const fakeAddButton = sinon.stub().returnsThis();
        const fakeDialog = {
            error: fakeError,
            addButton: fakeAddButton
        };

        sinon.replace(window.toastr, 'dialog', fakeDialog);
        const fakeLocationReload = sinon.stub();

        const fakeWindow = {
            location: {
                reload: () => { }
            }
        };

        sinon.replace(fakeWindow.location, 'reload', fakeLocationReload);

        // act
        window.pricingEstimatesGrid.testingOnly.displayToastErrorMessage(error, fakeWindow);

        // assert
        expect(window.toastr.dialog.error.callCount).toBe(1);
        expect(window.toastr.dialog.error.getCall(0).args[0].includes('a<br />b')).toBeTrue();
        expect(window.toastr.dialog.addButton.getCall(0).args[0].includes('OK')).toBeTrue();
    });

    it('displayToastErrorMessage will create toastr with generic error for ApplicationException', () => {
        // arrange
        const generalErrorMessage = 'An issue was encountered. Please try again later or contact your administrator for more information.';
        const generalErrorTitle = 'General Error';
        const error = {
            body: {
                exceptionType: 'System.ApplicationException'
            }
        };

        // can we use this for the other test which overrode ese.fetch?
        const fakeError = sinon.stub().returnsThis();

        sinon.replace(window.toastr, 'error', fakeError);

        const fakeWindow = {
            location: {
                reload: () => { }
            }
        };

        // act
        window.pricingEstimatesGrid.testingOnly.displayToastErrorMessage(error, fakeWindow);

        // assert
        expect(window.toastr.error.callCount).toBe(1);
        expect(window.toastr.error.getCall(0).args[0].includes(generalErrorMessage)).toBeTrue();
        expect(window.toastr.error.getCall(0).args[1].includes(generalErrorTitle)).toBeTrue();

    });

    it('displayToastErrorMessage will create toastr with generic error for undefined exceptionType', () => {
        // arrange
        const generalErrorMessage = 'An issue was encountered. Please try again later or contact your administrator for more information.';
        const generalErrorTitle = 'General Error';
        const error = {
            body: {
                // exceptionType is undefined
            }
        };

        const fakeError = sinon.stub();
        sinon.replace(window.toastr, 'error', fakeError);

        const fakeWindow = {
            location: {
                reload: () => { }
            }
        };

        // act
        window.pricingEstimatesGrid.testingOnly.displayToastErrorMessage(error, fakeWindow);

        // assert
        expect(window.toastr.error.callCount).toBe(1);
        const toastrArgs = window.toastr.error.getCall(0).args;
        expect(toastrArgs[0].includes(generalErrorMessage)).toBeTrue();
        expect(toastrArgs[1].includes(generalErrorTitle)).toBeTrue();
    });

    it('displayToastErrorMessage will create toastr for null exceptionType with exceptionMessage', () => {
        // arrange
        const error = {
            body: {
                exceptionMessage: 'we got a problem',
                exceptionType: 'SuperAwesomeException'
            }
        };

        const fakeError = sinon.fake();//.returnsThis();
        sinon.replace(window.toastr, 'error', fakeError);

        const fakeWindow = {
            location: {
                reload: () => { }
            }
        };

        // act
        window.pricingEstimatesGrid.testingOnly.displayToastErrorMessage(error, fakeWindow);

        // assert
        expect(window.toastr.error.callCount).toBe(1);
        expect(window.toastr.error.getCall(0).args[0].includes(error.body.exceptionMessage)).toBeTrue();
    });

    it('displayToastErrorMessage will log error', () => {

        // arrange
        const fakeConsoleLog = sinon.fake();
        sinon.replace(console, 'log', sinon.fake.returns(fakeConsoleLog));

        const fakeWindow = {
            location: {
                reload: () => { }
            }
        };

        // act
        // todo (YOUR NAME HERE Apr 8, 2020) - reverse this order or wrap it so consumers don't need to care about the window object - except for in testing? - here we are.
        window.pricingEstimatesGrid.testingOnly.displayToastErrorMessage(fakeWindow, {});
        // assert
        expect(console.log.callCount).toBe(1);
    });

    it('convertEstimatesToGridRows will properly name package actual rows', () => {

        // arrange
        const data =
            [{ "Id": 1552133, "SellingRotationId": 41473, "PriceBreakGroupingSellingRotationId": null, "PriceBreak": { "Name": null, "Start": "2020-12-28T00:00:00", "End": "2021-03-28T00:00:00", "QuarterNumber": 1, "Year": 2021, "HiatusDates": [] }, "ReplacementSellingRotationId": null, "Name": "NFL Wildcard Countdown (ESPN Simulcast)", "Active": true, "Quarter": { "QuarterNumber": 1, "Year": 2021 }, "OutOfSale": true, "OutOfSaleReasonId": 23, "OutOfSaleReason": "Reassigned to New SR", "Outlet": "ESPN", "PrimaryOutletId": 5, "PrimaryCategoryName": "NFL PROGRAMMING", "PrimarySubCategoryName": "NFL COUNTDOWN", "OutletId": 1, "RateCardId": 1, "RateCard": "Sales Estimate", "RateCardVersion": "304", "RateCardRevision": "00686", "RatecardReleaseId": 39317, "DaypartId": 2, "Daypart": "01 - MON-SUN 12:00AM TO 05:59AM", "Category": { "Id": 309, "Code": "NFL", "Name": "NFL PROGRAMMING", "Description": "NFL", "IsLive": true, "TotalHomeAdjustmentFactor": 2.5, "EffectiveDate": "0001-01-01T00:00:00", "ExpiryDate": null, "Notes": "ADS_RTCRD", "LastModifiedBy": "ADS_RTCRD", "LastModifiedDate": "2017-08-28T11:50:29", "IsUsed": false, "ParentCategoryId": null, "ParentCategoryCode": null, "ParentCategoryName": null, "ParentCategoryDescription": null }, "Subcategory": { "Id": 310, "Code": "CNTD", "Name": "NFL COUNTDOWN", "Description": null, "IsLive": false, "TotalHomeAdjustmentFactor": 2.5, "EffectiveDate": "0001-01-01T00:00:00", "ExpiryDate": null, "Notes": "ADS_RTCRD", "LastModifiedBy": "ADS_RTCRD", "LastModifiedDate": "2017-08-28T11:50:29", "IsUsed": false, "ParentCategoryId": 309, "ParentCategoryCode": "NFL", "ParentCategoryName": "NFL PROGRAMMING", "ParentCategoryDescription": "NFL" }, "PackageId": 1616, "PackageSellingRotationTypeId": 1, "Primary": false, "DisplaySequence": 1, "Live": false, "Rate": 0, "IsCurrent": true, "Comments": null, "DeliveryStreamId": 2, "DeliveryStream": "C3", "WorkingDraft": null, "IsWorking": false, "IsVirtualWorking": false, "BaseDemographics": [], "CompositeDemographics": [], "ReleaseNotes": "Releasing updated index - Bethia", "ReleaseDate": "2020-06-17T11:24:46", "MultiOutlet": false, "IsPackage": false, "SourceType": "", "PrimaryDeliveryStream": null, "EstimateType": "Released", "AopDemo": null, "AopCpm": 0, "AopRate": 0, "AopImps": 0, "IsPreemptable": false, "PackagePeriodVersionId": 8772, "PackagePeriodVersionReleaseId": 8694, "ConcurrencyVersion": 1, "ValidationErrors": {}, "IsValid": true, "ValidationMessages": {} }, { "Id": 1552466, "SellingRotationId": 41472, "PriceBreakGroupingSellingRotationId": null, "PriceBreak": { "Name": null, "Start": "2020-12-28T00:00:00", "End": "2021-03-28T00:00:00", "QuarterNumber": 1, "Year": 2021, "HiatusDates": [] }, "ReplacementSellingRotationId": 43318, "Name": "NFL Wildcard Countdown", "Active": true, "Quarter": { "QuarterNumber": 1, "Year": 2021 }, "OutOfSale": true, "OutOfSaleReasonId": 23, "OutOfSaleReason": "Reassigned to New SR", "Outlet": "ABC (ESPN TB)", "PrimaryOutletId": 5, "PrimaryCategoryName": "NFL PROGRAMMING", "PrimarySubCategoryName": "NFL COUNTDOWN", "OutletId": 5, "RateCardId": 1, "RateCard": "Sales Estimate", "RateCardVersion": "304", "RateCardRevision": "00686", "RatecardReleaseId": 39317, "DaypartId": 2, "Daypart": "01 - MON-SUN 12:00AM TO 05:59AM", "Category": { "Id": 309, "Code": "NFL", "Name": "NFL PROGRAMMING", "Description": "NFL", "IsLive": true, "TotalHomeAdjustmentFactor": 2.5, "EffectiveDate": "0001-01-01T00:00:00", "ExpiryDate": null, "Notes": "ADS_RTCRD", "LastModifiedBy": "ADS_RTCRD", "LastModifiedDate": "2017-08-28T11:50:29", "IsUsed": false, "ParentCategoryId": null, "ParentCategoryCode": null, "ParentCategoryName": null, "ParentCategoryDescription": null }, "Subcategory": { "Id": 310, "Code": "CNTD", "Name": "NFL COUNTDOWN", "Description": null, "IsLive": false, "TotalHomeAdjustmentFactor": 2.5, "EffectiveDate": "0001-01-01T00:00:00", "ExpiryDate": null, "Notes": "ADS_RTCRD", "LastModifiedBy": "ADS_RTCRD", "LastModifiedDate": "2017-08-28T11:50:29", "IsUsed": false, "ParentCategoryId": 309, "ParentCategoryCode": "NFL", "ParentCategoryName": "NFL PROGRAMMING", "ParentCategoryDescription": "NFL" }, "PackageId": 1616, "PackageSellingRotationTypeId": 1, "Primary": true, "DisplaySequence": 0, "Live": false, "Rate": 101548, "IsCurrent": true, "Comments": null, "DeliveryStreamId": 2, "DeliveryStream": "C3", "WorkingDraft": null, "IsWorking": false, "IsVirtualWorking": false, "BaseDemographics": [], "CompositeDemographics": [], "ReleaseNotes": "Releasing updated index - Bethia", "ReleaseDate": "2020-06-17T11:24:46", "MultiOutlet": false, "IsPackage": false, "SourceType": "", "PrimaryDeliveryStream": null, "EstimateType": "Released", "AopDemo": null, "AopCpm": 0, "AopRate": 0, "AopImps": 0, "IsPreemptable": false, "PackagePeriodVersionId": 8772, "PackagePeriodVersionReleaseId": 8694, "ConcurrencyVersion": 1, "ValidationErrors": {}, "IsValid": true, "ValidationMessages": {} }, { "Id": 1552133, "SellingRotationId": 41473, "PriceBreakGroupingSellingRotationId": null, "PriceBreak": null, "ReplacementSellingRotationId": null, "Name": "NFL Wildcard Countdown (ESPN Simulcast)", "Active": true, "Quarter": { "QuarterNumber": 1, "Year": 2021 }, "OutOfSale": true, "OutOfSaleReasonId": 23, "OutOfSaleReason": "Reassigned to New SR", "Outlet": "ESPN", "PrimaryOutletId": 5, "PrimaryCategoryName": "NFL PROGRAMMING", "PrimarySubCategoryName": "NFL COUNTDOWN", "OutletId": 1, "RateCardId": 1, "RateCard": "Sales Estimate", "RateCardVersion": "304", "RateCardRevision": "00686", "RatecardReleaseId": 39317, "DaypartId": null, "Daypart": "01 - MON-SUN 12:00AM TO 05:59AM", "Category": { "Id": 309, "Code": "NFL", "Name": "NFL PROGRAMMING", "Description": "NFL", "IsLive": null, "TotalHomeAdjustmentFactor": 0, "EffectiveDate": "0001-01-01T00:00:00", "ExpiryDate": null, "Notes": null, "LastModifiedBy": null, "LastModifiedDate": null, "IsUsed": false, "ParentCategoryId": null, "ParentCategoryCode": null, "ParentCategoryName": null, "ParentCategoryDescription": null }, "Subcategory": { "Id": 310, "Code": "CNTD", "Name": "NFL COUNTDOWN", "Description": null, "IsLive": null, "TotalHomeAdjustmentFactor": 0, "EffectiveDate": "0001-01-01T00:00:00", "ExpiryDate": null, "Notes": null, "LastModifiedBy": null, "LastModifiedDate": null, "IsUsed": false, "ParentCategoryId": 309, "ParentCategoryCode": "NFL", "ParentCategoryName": "NFL PROGRAMMING", "ParentCategoryDescription": "NFL" }, "PackageId": 1616, "PackageSellingRotationTypeId": null, "Primary": false, "DisplaySequence": 0, "Live": false, "Rate": 0, "IsCurrent": true, "Comments": null, "DeliveryStreamId": 2, "DeliveryStream": "C3", "WorkingDraft": null, "IsWorking": false, "IsVirtualWorking": false, "BaseDemographics": [], "CompositeDemographics": [], "ReleaseNotes": "", "ReleaseDate": "2020-06-17T11:24:46", "MultiOutlet": false, "IsPackage": false, "SourceType": "", "PrimaryDeliveryStream": null, "EstimateType": "Actual", "AopDemo": null, "AopCpm": 0, "AopRate": 0, "AopImps": 0, "IsPreemptable": false, "PackagePeriodVersionId": null, "PackagePeriodVersionReleaseId": null, "ConcurrencyVersion": 1, "ValidationErrors": {}, "IsValid": true, "ValidationMessages": {} }, { "Id": 1552466, "SellingRotationId": 41472, "PriceBreakGroupingSellingRotationId": null, "PriceBreak": null, "ReplacementSellingRotationId": null, "Name": "NFL Wildcard Countdown", "Active": true, "Quarter": { "QuarterNumber": 1, "Year": 2021 }, "OutOfSale": true, "OutOfSaleReasonId": 23, "OutOfSaleReason": "Reassigned to New SR", "Outlet": "ABC (ESPN TB)", "PrimaryOutletId": 5, "PrimaryCategoryName": "NFL PROGRAMMING", "PrimarySubCategoryName": "NFL COUNTDOWN", "OutletId": 5, "RateCardId": 1, "RateCard": "Sales Estimate", "RateCardVersion": "304", "RateCardRevision": "00686", "RatecardReleaseId": 39317, "DaypartId": null, "Daypart": "01 - MON-SUN 12:00AM TO 05:59AM", "Category": { "Id": 309, "Code": "NFL", "Name": "NFL PROGRAMMING", "Description": "NFL", "IsLive": null, "TotalHomeAdjustmentFactor": 0, "EffectiveDate": "0001-01-01T00:00:00", "ExpiryDate": null, "Notes": null, "LastModifiedBy": null, "LastModifiedDate": null, "IsUsed": false, "ParentCategoryId": null, "ParentCategoryCode": null, "ParentCategoryName": null, "ParentCategoryDescription": null }, "Subcategory": { "Id": 310, "Code": "CNTD", "Name": "NFL COUNTDOWN", "Description": null, "IsLive": null, "TotalHomeAdjustmentFactor": 0, "EffectiveDate": "0001-01-01T00:00:00", "ExpiryDate": null, "Notes": null, "LastModifiedBy": null, "LastModifiedDate": null, "IsUsed": false, "ParentCategoryId": 309, "ParentCategoryCode": "NFL", "ParentCategoryName": "NFL PROGRAMMING", "ParentCategoryDescription": "NFL" }, "PackageId": 1616, "PackageSellingRotationTypeId": null, "Primary": true, "DisplaySequence": 0, "Live": false, "Rate": 101548, "IsCurrent": true, "Comments": null, "DeliveryStreamId": 2, "DeliveryStream": "C3", "WorkingDraft": null, "IsWorking": false, "IsVirtualWorking": false, "BaseDemographics": [], "CompositeDemographics": [], "ReleaseNotes": "", "ReleaseDate": "2020-06-17T11:24:46", "MultiOutlet": false, "IsPackage": false, "SourceType": "", "PrimaryDeliveryStream": null, "EstimateType": "Actual", "AopDemo": null, "AopCpm": 0, "AopRate": 0, "AopImps": 0, "IsPreemptable": false, "PackagePeriodVersionId": null, "PackagePeriodVersionReleaseId": null, "ConcurrencyVersion": 1, "ValidationErrors": {}, "IsValid": true, "ValidationMessages": {} }, { "Id": 1552466, "SellingRotationId": 0, "PriceBreakGroupingSellingRotationId": null, "PriceBreak": null, "ReplacementSellingRotationId": null, "Name": "NFL Wildcard Countdown", "Active": true, "Quarter": { "QuarterNumber": 1, "Year": 2021 }, "OutOfSale": true, "OutOfSaleReasonId": null, "OutOfSaleReason": null, "Outlet": "ABC (ESPN TB)", "PrimaryOutletId": 5, "PrimaryCategoryName": "NFL PROGRAMMING", "PrimarySubCategoryName": "NFL COUNTDOWN", "OutletId": 5, "RateCardId": 1, "RateCard": "Sales Estimate", "RateCardVersion": "304", "RateCardRevision": "00686", "RatecardReleaseId": 39317, "DaypartId": null, "Daypart": "", "Category": { "Id": 309, "Code": "NFL", "Name": "NFL PROGRAMMING", "Description": "NFL", "IsLive": true, "TotalHomeAdjustmentFactor": 2.5, "EffectiveDate": "0001-01-01T00:00:00", "ExpiryDate": null, "Notes": "ADS_RTCRD", "LastModifiedBy": "ADS_RTCRD", "LastModifiedDate": "2017-08-28T11:50:29", "IsUsed": false, "ParentCategoryId": null, "ParentCategoryCode": null, "ParentCategoryName": null, "ParentCategoryDescription": null }, "Subcategory": { "Id": 310, "Code": "CNTD", "Name": "NFL COUNTDOWN", "Description": null, "IsLive": false, "TotalHomeAdjustmentFactor": 2.5, "EffectiveDate": "0001-01-01T00:00:00", "ExpiryDate": null, "Notes": "ADS_RTCRD", "LastModifiedBy": "ADS_RTCRD", "LastModifiedDate": "2017-08-28T11:50:29", "IsUsed": false, "ParentCategoryId": 309, "ParentCategoryCode": "NFL", "ParentCategoryName": "NFL PROGRAMMING", "ParentCategoryDescription": "NFL" }, "PackageId": 1616, "PackageSellingRotationTypeId": null, "Primary": false, "DisplaySequence": 0, "Live": false, "Rate": 101548, "IsCurrent": true, "Comments": null, "DeliveryStreamId": 0, "DeliveryStream": "C3", "WorkingDraft": null, "IsWorking": false, "IsVirtualWorking": false, "BaseDemographics": [], "CompositeDemographics": [], "ReleaseNotes": "Releasing updated index - Bethia", "ReleaseDate": "2020-06-17T11:24:46", "MultiOutlet": true, "IsPackage": true, "SourceType": "", "PrimaryDeliveryStream": null, "EstimateType": "Released", "AopDemo": null, "AopCpm": 0, "AopRate": 0, "AopImps": 0, "IsPreemptable": false, "PackagePeriodVersionId": null, "PackagePeriodVersionReleaseId": null, "ConcurrencyVersion": 0, "ValidationErrors": {}, "IsValid": true, "ValidationMessages": {} }, { "Id": 1552466, "SellingRotationId": 0, "PriceBreakGroupingSellingRotationId": null, "PriceBreak": null, "ReplacementSellingRotationId": null, "Name": "NFL Wildcard Countdown", "Active": true, "Quarter": { "QuarterNumber": 1, "Year": 2021 }, "OutOfSale": true, "OutOfSaleReasonId": null, "OutOfSaleReason": null, "Outlet": "ABC (ESPN TB)", "PrimaryOutletId": 5, "PrimaryCategoryName": "NFL PROGRAMMING", "PrimarySubCategoryName": "NFL COUNTDOWN", "OutletId": 5, "RateCardId": 1, "RateCard": "Sales Estimate", "RateCardVersion": "304", "RateCardRevision": "00686", "RatecardReleaseId": 39317, "DaypartId": null, "Daypart": "", "Category": { "Id": 309, "Code": "NFL", "Name": "NFL PROGRAMMING", "Description": "NFL", "IsLive": null, "TotalHomeAdjustmentFactor": 0, "EffectiveDate": "0001-01-01T00:00:00", "ExpiryDate": null, "Notes": null, "LastModifiedBy": null, "LastModifiedDate": null, "IsUsed": false, "ParentCategoryId": null, "ParentCategoryCode": null, "ParentCategoryName": null, "ParentCategoryDescription": null }, "Subcategory": { "Id": 310, "Code": "CNTD", "Name": "NFL COUNTDOWN", "Description": null, "IsLive": null, "TotalHomeAdjustmentFactor": 0, "EffectiveDate": "0001-01-01T00:00:00", "ExpiryDate": null, "Notes": null, "LastModifiedBy": null, "LastModifiedDate": null, "IsUsed": false, "ParentCategoryId": 309, "ParentCategoryCode": "NFL", "ParentCategoryName": "NFL PROGRAMMING", "ParentCategoryDescription": "NFL" }, "PackageId": 1616, "PackageSellingRotationTypeId": null, "Primary": false, "DisplaySequence": 0, "Live": false, "Rate": 101548, "IsCurrent": true, "Comments": null, "DeliveryStreamId": 0, "DeliveryStream": "C3", "WorkingDraft": null, "IsWorking": false, "IsVirtualWorking": false, "BaseDemographics": [], "CompositeDemographics": [], "ReleaseNotes": "", "ReleaseDate": "2020-06-17T11:24:46", "MultiOutlet": true, "IsPackage": true, "SourceType": "", "PrimaryDeliveryStream": null, "EstimateType": "Actual", "AopDemo": null, "AopCpm": 0, "AopRate": 0, "AopImps": 0, "IsPreemptable": false, "PackagePeriodVersionId": null, "PackagePeriodVersionReleaseId": null, "ConcurrencyVersion": 0, "ValidationErrors": {}, "IsValid": true, "ValidationMessages": {} }]
            ;

        sinon.replace(window.streamIndex, 'calculateIndicesFor', sinon.stub().returnsArg(0));
        //todo check
        sinon.replace(window.authorization, 'CanEditRcGrid', sinon.stub().returns(true));

        window.pricingEstimatesGrid.testingOnly.override.searchViewModel({ IncludeWorkingRow: () => { return false } });

        // act
        const response = window.pricingEstimatesGrid.testingOnly.convertEstimatesToGridRows(data);

        // assert
        expect(response).toBeTruthy();

        const numberOfActualsRows = data.filter(x => x.EstimateType === 'Actual').length;
        const numberOfPackageActualsRows = data.filter(x => x.EstimateType === 'Actual' && x.IsPackage).length;

        const numberOfGridActualRowsIncludingPackages = response.filter(x => x.rowType.includes('Actual')).length;
        const numberOfGridPackageActualRows = response.filter(x => x.rowType.includes('Package (Actual)')).length;

        expect(numberOfGridActualRowsIncludingPackages).toEqual(numberOfActualsRows);
        expect(numberOfGridPackageActualRows).toEqual(numberOfPackageActualsRows);
    });

    it('getGridData will reject promise if invalid searchViewModel', (done) => {

        // arrange
        window.pricingEstimatesGrid.testingOnly.override.searchViewModel({ isValid: () => { return false; } });

        // act
        const response = window.pricingEstimatesGrid.testingOnly.getGridData();
        expect(response).toBeTruthy();

        // assert
        // must call done callback if testing fail condition of a promise
        response.fail((data) => {
            expect(data).toEqual(undefined);
            window.pricingEstimatesGrid.testingOnly.restore('searchViewModel');
            done();
        });
    });

    it('getGridData will return populated estimates', () => {

        // arrange
        const json = { "response": {}, "body": [{ "Id": 1462791, "SellingRotationId": 41785, "ReplacementSellingRotationId": null, "Name": "Sportscenter - Post MNF - MON 11: 30PM - 1: 00AM w.RPT & Live Streaming", "Active": true, "Quarter": { "QuarterNumber": 3, "Year": 2020 }, "OutOfSale": false, "OutOfSaleReasonId": null, "OutOfSaleReason": "", "Outlet": "ESPN", "PrimaryOutletId": 1, "PrimaryCategoryName": "SPORT NEWS: SPORTSCENTER", "PrimarySubCategoryName": "PRIME", "OutletId": 1, "RateCardId": 1, "RateCard": "Sales Ratecard", "RateCardVersion": "292", "RateCardRevision": "0", "RatecardReleaseId": 38012, "DaypartId": 170, "Daypart": "M - M - SU 12A - 3A", "Category": { "Id": 343, "Code": "SC", "Name": "SPORT NEWS: SPORTSCENTER", "Description": "SportsCenter", "IsLive": false, "TotalHomeAdjustmentFactor": 2.5, "EffectiveDate": "0001 - 01 - 01T00: 00: 00", "ExpiryDate": null, "Notes": "ADS_RTCRD", "LastModifiedBy": "ADS_RTCRD", "LastModifiedDate": "2017 - 08 - 28T11: 50: 29", "IsUsed": false, "ParentCategoryId": null, "ParentCategoryCode": null, "ParentCategoryName": null, "ParentCategoryDescription": null }, "Subcategory": { "Id": 6940, "Code": "PRM", "Name": "PRIME", "Description": null, "IsLive": false, "TotalHomeAdjustmentFactor": 1, "EffectiveDate": "2018 - 12 - 04T00: 00: 00", "ExpiryDate": null, "Notes": "0aab3cf5 - 6123 - 4b61 - 86fc - c75fdd49b3e1", "LastModifiedBy": "0aab3cf5 - 6123 - 4b61 - 86fc - c75fdd49b3e1", "LastModifiedDate": "2018 - 12 - 04T16: 54: 03", "IsUsed": false, "ParentCategoryId": 343, "ParentCategoryCode": "SC", "ParentCategoryName": "SPORT NEWS: SPORTSCENTER", "ParentCategoryDescription": "SportsCenter" }, "PackageId": 1647, "PackageSellingRotationTypeId": 1, "Primary": true, "DisplaySequence": 0, "Live": false, "Rate": 65217, "IsCurrent": true, "Comments": null, "DeliveryStreamId": 2, "DeliveryStream": "C3", "WorkingDraft": null, "IsWorking": false, "BaseDemographics": [], "CompositeDemographics": [], "ReleaseNotes": "Episode Level Ratings Auto - Release", "ReleaseDate": "2019 - 12 - 13T18: 06: 35", "MultiOutlet": false, "IsPackage": false, "SourceType": "", "PrimaryDeliveryStream": null, "EstimateType": "Released", "AopDemo": null, "AopCpm": 0, "AopRate": 0, "AopImps": 0, "IsPreemptable": false, "ConcurrencyVersion": 0, "ValidationErrors": {}, "IsValid": true, "ValidationMessages": {} }] };

        const deferredPromise = Promise.resolve(json);
        const fakeFetch = sinon.fake.returns(deferredPromise);

        window.pricingEstimatesGrid.testingOnly.override.pricingEstimateSearch(fakeFetch);

        window.pricingEstimatesGrid.testingOnly.override.searchViewModel(
            {
                isValid: () => { return true; },
                DeliveryStreamNames: () => { return []; },
                getDataForAjax: () => { return JSON.stringify({ 'foo': 'bar' }); }
            });
        sinon.replace(window.viewModels, 'PricingEstimatesGridSearchViewModel', sinon.stub().returns({ getDataForAjax: () => { return { 'a': 'b' } } }));

        // act
        const response = window.pricingEstimatesGrid.testingOnly.getGridData();
        expect(response).toBeTruthy();

        // assert
        // the point of this test is not to actually do anything with the reject of the main method, 
        // we're simply looking to see that we've delegated work to a common error handler for toast to output message to screen, that will be tested in isolation
        return response.then((data) => {
            expect(data).toBeTruthy();
            expect(Array.isArray(data.Estimates)).toBeTrue();
        });
        //.finally(() => {
        //    expect(response).toBeTruthy();
        //    response.then((data) => {
        //        expect(data).toBeTruthy();
        //        expect(Array.isArray(data.Estimates)).toBeTrue();
        //done();
        //    });
        //});
    });

    it('getGridData resulting in a fail call will populate ValidationMessage', () => {

        // arrange
        const json = { "body": { "responseType": "result", "url": "http://localhost/RateCard/api/PricingEstimates/search", "status": 400, "statusText": "Bad Request", "message": "Request validation failed", "content": { "Name": null, "Conditions": [{ "Message": "If package rows are requested, then no demographics can be as all must be used", "Severity": "ERROR" }], "ValidationResults": [] } } };

        const deferredPromise = Promise.reject(json);
        const fakeFetch = sinon.fake.returns(deferredPromise);
        window.pricingEstimatesGrid.testingOnly.override.pricingEstimateSearch(fakeFetch);

        const fakedisplayToastErrorMessage = sinon.fake();
        window.pricingEstimatesGrid.testingOnly.override.displayToastErrorMessage(fakedisplayToastErrorMessage);

        window.pricingEstimatesGrid.testingOnly.override.searchViewModel(
            {
                isValid: () => { return true; },
                DeliveryStreamNames: () => { return []; },
                getDataForAjax: () => { return JSON.stringify({ 'foo': 'bar' }); }
            });
        sinon.replace(window.viewModels, 'PricingEstimatesGridSearchViewModel', sinon.stub().returns({ getDataForAjax: () => { return { 'a': 'b' } } }));

        // act
        const response = window.pricingEstimatesGrid.testingOnly.getGridData();
        expect(response).toBeTruthy();

        // assert
        // the point of this test is not to actually do anything with the reject of the main method, 
        // we're simply looking to see that we've delegated work to a common error handler for toast to output message to screen, that will be tested in isolation
        return deferredPromise.catch((data) => {
            expect(data).toBeTruthy();
        }).finally(() => {
            expect(response.state()).toBe('rejected');
            expect(fakedisplayToastErrorMessage.callCount).toEqual(1);
        });
    });

    it('getGridData resulting in a success call will populate Estimates', (done) => {

        // arrange
        const json =
            { "body": [{ "Id": 1477051, "SellingRotationId": 41785, "ReplacementSellingRotationId": null, "Name": "Sportscenter - Post MNF - MON 11: 30PM - 1: 00AM w.RPT & Live Streaming", "Active": true, "Quarter": { "QuarterNumber": 3, "Year": 2020 }, "OutOfSale": false, "OutOfSaleReasonId": null, "OutOfSaleReason": "", "Outlet": "ESPN", "PrimaryOutletId": 1, "PrimaryCategoryName": "SPORT NEWS: SPORTSCENTER", "PrimarySubCategoryName": "PRIME", "OutletId": 1, "RateCardId": 1, "RateCard": "Sales Ratecard", "RateCardVersion": null, "RateCardRevision": null, "RatecardReleaseId": null, "DaypartId": 170, "Daypart": "M - M - SU 12A - 3A", "Category": { "Id": 343, "Code": "SC", "Name": "SPORT NEWS: SPORTSCENTER", "Description": "SportsCenter", "IsLive": false, "TotalHomeAdjustmentFactor": 2.5, "EffectiveDate": "0001 - 01 - 01T00: 00: 00", "ExpiryDate": null, "Notes": "ADS_RTCRD", "LastModifiedBy": "ADS_RTCRD", "LastModifiedDate": "2017 - 08 - 28T11: 50: 29", "IsUsed": false, "ParentCategoryId": null, "ParentCategoryCode": null, "ParentCategoryName": null, "ParentCategoryDescription": null }, "Subcategory": { "Id": 6940, "Code": "PRM", "Name": "PRIME", "Description": null, "IsLive": false, "TotalHomeAdjustmentFactor": 1, "EffectiveDate": "2018 - 12 - 04T00: 00: 00", "ExpiryDate": null, "Notes": "0aab3cf5 - 6123 - 4b61 - 86fc - c75fdd49b3e1", "LastModifiedBy": "0aab3cf5 - 6123 - 4b61 - 86fc - c75fdd49b3e1", "LastModifiedDate": "2018 - 12 - 04T16: 54: 03", "IsUsed": false, "ParentCategoryId": 343, "ParentCategoryCode": "SC", "ParentCategoryName": "SPORT NEWS: SPORTSCENTER", "ParentCategoryDescription": "SportsCenter" }, "PackageId": 1647, "PackageSellingRotationTypeId": 1, "Primary": true, "DisplaySequence": 0, "Live": false, "Rate": 65217, "IsCurrent": false, "Comments": "", "DeliveryStreamId": 2, "DeliveryStream": "C3", "WorkingDraft": null, "IsWorking": true, "BaseDemographics": [], "CompositeDemographics": [], "ReleaseNotes": null, "ReleaseDate": null, "MultiOutlet": false, "IsPackage": false, "SourceType": "", "PrimaryDeliveryStream": null, "EstimateType": "Released", "AopDemo": null, "AopCpm": 0, "AopRate": 0, "AopImps": 0, "IsPreemptable": false, "ConcurrencyVersion": 0, "ValidationErrors": {}, "IsValid": true, "ValidationMessages": {} }] };

        const ajaxStub = sinon.stub().resolves(json);

        const deferredPromise = Promise.resolve(json);
        const fakeFetch = sinon.fake.returns(deferredPromise);
        sinon.replace(window.rateCard, 'ajax', ajaxStub);

        window.pricingEstimatesGrid.testingOnly.override.pricingEstimateSearch(fakeFetch);

        window.pricingEstimatesGrid.testingOnly.override.searchViewModel(
            {
                isValid: () => { return true; },
                DeliveryStreamNames: () => { return []; },
                getDataForAjax: () => { return JSON.stringify({ 'foo': 'bar' }); }
            });

        // act
        const response = window.pricingEstimatesGrid.testingOnly.getGridData();

        // assert
        response.then((data) => {
            expect(data).toBeTruthy();
            expect(data.ValidationMessage).toBeFalsy();
            done();
        });

    });

    it('getWorkingDraftEstimate gets correct row', () => {
        // Arrange
        var workingDrafts = [
            {
                SellingRotationId: 1,
                PackageId: 123,
                Quarter: {
                    QuarterNumber: 1,
                    Year: 2021
                },
                DeliveryStream: 'C3',
                IsWorking: true
            },
            {
                SellingRotationId: 2,
                PackageId: 123,
                Quarter: {
                    QuarterNumber: 1,
                    Year: 2021
                },
                DeliveryStream: 'C3',
                IsWorking: true
            },
            {
                SellingRotationId: 0,
                PackageId: 123,
                Quarter: {
                    QuarterNumber: 1,
                    Year: 2021
                },
                DeliveryStream: 'C3',
                IsWorking: true
            }
        ];

        var estimate = {
            SellingRotationId: 0,
            PackageId: 123,
            Quarter: {
                QuarterNumber: 1,
                Year: 2021
            },
            DeliveryStream: 'C3',
            IsWorking: true
        };

        // Act
        var result = window.pricingEstimatesGrid.testingOnly.getWorkingDraftEstimate(estimate, workingDrafts);

        // Assert
        expect(result.SellingRotationId).toEqual(estimate.SellingRotationId);
    });

    it('initializeRatecardIdDropdown puts first ratecard as selected', async () => {
        // Arrange
        const ajaxStub = sinon.stub().resolves([
            {
                Id: "1",
                Description: "Test1"
            },
            {
                Id: "2",
                Description: "Test2"
            }
        ]);

        sinon.replace(window.rateCard, 'ajax', ajaxStub);

        pricingEstimatesGrid.testingOnly.setSearchViewModel({ RatecardId: param => { } });

        // Act
        await window.pricingEstimatesGrid.testingOnly.initializeRatecardIdDropdown();

        // Assert
        var dropdown = document.getElementById('RatecardId').options;
        var index = document.getElementById('RatecardId').options.selectedIndex;
        expect(index).toEqual(0);
        expect(dropdown[index].value).toEqual("1");
    });

    it('initializeRatecardIdDropdown puts unique ratecard as selected', async () => {
        // Arrange
        const ajaxStub = sinon.stub().resolves([
            {
                Id: "3",
                Description: "Test3"
            }
        ]);

        sinon.replace(window.rateCard, 'ajax', ajaxStub);

        pricingEstimatesGrid.testingOnly.setSearchViewModel({ RatecardId: param => { } });

        // Act
        await window.pricingEstimatesGrid.testingOnly.initializeRatecardIdDropdown();


        // Assert
        var dropdown = document.getElementById('RatecardId').options;
        var index = document.getElementById('RatecardId').options.selectedIndex;
        expect(index).toEqual(0);
        expect(dropdown[index].value).toEqual("3");
    });

    it('pricingEstimateSearch will return promise', () => {

        // arrange
        const json = { "foo": "bar" };

        // this spy will allow us to adequately test the callbacks that go out to ese.fetch without having to rely on library itself
        spyOn(ese, 'fetch').and.callFake(function (params) {
            params.fetchStart();
            params.fetchStop();

            return Promise.resolve(json);
        });

        const fakeShow = sinon.fake();
        const fakeHide = sinon.fake();
        sinon.replace(window.rateCard.mask, 'show', sinon.fake.returns(fakeShow));
        sinon.replace(window.rateCard.mask, 'remove', sinon.fake.returns(fakeHide));
        var searchViewModelData = {};

        // act
        var result = window.pricingEstimatesGrid.testingOnly.pricingEstimateSearch(searchViewModelData);

        // assert
        return result.then((response) => {
            expect(response).toBeTruthy();
            expect(fakeShow).toBeTruthy();
            expect(fakeHide).toBeTruthy();
            expect(window.rateCard.mask.show.callCount).toBe(1);
            expect(window.rateCard.mask.remove.callCount).toBe(1);
        });
    });

    it('sortGridRows correctly sorts array by package, year, quarter, selling rotation id, and rowType', () => {
        // Arrange
        var gridRows = [{
            "packageId": 0,
            "quarter": "3Q/2020",
            "sellingRotationId": 44342,
            "rowType": "Released",
            "ratecardVersionDisplay": "306.77",
            "ratecardVersion": "306",
            "ratecardRevision": "77"
        }, {
            "packageId": 1631,
            "quarter": "3Q/2020",
            "sellingRotationId": 0,
            "rowType": "Package (Actual)",
            "ratecardVersionDisplay": "Actual",
            "ratecardVersion": "308",
            "ratecardRevision": "0"
        }, {
            "packageId": 1631,
            "quarter": "4Q/2020",
            "sellingRotationId": 41737,
            "rowType": "Released",
            "ratecardVersionDisplay": "Current",
            "ratecardVersion": "317",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 41737,
            "primary": true
        }, {
            "packageId": 1631,
            "quarter": "4Q/2020",
            "sellingRotationId": 41737,
            "rowType": "Working",
            "ratecardVersionDisplay": "Working",
            "ratecardVersion": "317",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 41737
        }, {
            "packageId": 0,
            "quarter": "4Q/2020",
            "sellingRotationId": 44342,
            "rowType": "Released",
            "ratecardVersionDisplay": "Current",
            "ratecardVersion": "317",
            "ratecardRevision": "0"
        }, {
            "packageId": 0,
            "quarter": "4Q/2020",
            "sellingRotationId": 44342,
            "rowType": "Working",
            "ratecardVersionDisplay": "Working",
            "ratecardVersion": "317",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 44342
        }, {
            "packageId": 1631,
            "quarter": "4Q/2020",
            "sellingRotationId": 41738,
            "rowType": "Released",
            "ratecardVersionDisplay": "Current",
            "ratecardVersion": "317",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 41738
        }, {
            "packageId": 1631,
            "quarter": "4Q/2020",
            "sellingRotationId": 41738,
            "rowType": "Working",
            "ratecardVersionDisplay": "Working",
            "ratecardVersion": "317",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 41738
        }, {
            "packageId": 1631,
            "quarter": "4Q/2020",
            "sellingRotationId": 41739,
            "rowType": "Released",
            "ratecardVersionDisplay": "Current",
            "ratecardVersion": "317",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 41739
        }, {
            "packageId": 1631,
            "quarter": "4Q/2020",
            "sellingRotationId": 41739,
            "rowType": "Working",
            "ratecardVersionDisplay": "Working",
            "ratecardVersion": "317",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 41739
        }, {
            "packageId": 1631,
            "quarter": "4Q/2020",
            "sellingRotationId": 41740,
            "rowType": "Released",
            "ratecardVersionDisplay": "Current",
            "ratecardVersion": "317",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 41740
        }, {
            "packageId": 1631,
            "quarter": "4Q/2020",
            "sellingRotationId": 41740,
            "rowType": "Working",
            "ratecardVersionDisplay": "Working",
            "ratecardVersion": "317",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 41740
        }, {
            "packageId": 1631,
            "quarter": "4Q/2020",
            "sellingRotationId": 41737,
            "rowType": "Released",
            "ratecardVersionDisplay": "316.0",
            "ratecardVersion": "316",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 41737
        }, {
            "packageId": 0,
            "quarter": "4Q/2020",
            "sellingRotationId": 44342,
            "rowType": "Released",
            "ratecardVersionDisplay": "316.0",
            "ratecardVersion": "316",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 44342
        }, {
            "packageId": 1631,
            "quarter": "4Q/2020",
            "sellingRotationId": 41738,
            "rowType": "Released",
            "ratecardVersionDisplay": "316.0",
            "ratecardVersion": "316",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 41738
        }, {
            "packageId": 1631,
            "quarter": "4Q/2020",
            "sellingRotationId": 41739,
            "rowType": "Released",
            "ratecardVersionDisplay": "316.0",
            "ratecardVersion": "316",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 41739
        }, {
            "packageId": 1631,
            "quarter": "4Q/2020",
            "sellingRotationId": 41738,
            "rowType": "Released",
            "ratecardVersionDisplay": "316.0",
            "ratecardVersion": "316",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 41738
        }, {
            "packageId": 1631,
            "quarter": "3Q/2020",
            "sellingRotationId": 41737,
            "rowType": "Released",
            "ratecardVersionDisplay": "Current",
            "ratecardVersion": "308",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 41737
        }, {
            "packageId": 0,
            "quarter": "3Q/2020",
            "sellingRotationId": 44342,
            "rowType": "Released",
            "ratecardVersionDisplay": "Current",
            "ratecardVersion": "308",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 44342
        }, {
            "packageId": 1631,
            "quarter": "3Q/2020",
            "sellingRotationId": 41738,
            "rowType": "Released",
            "ratecardVersionDisplay": "Current",
            "ratecardVersion": "308",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 41738
        }, {
            "packageId": 1631,
            "quarter": "3Q/2020",
            "sellingRotationId": 41739,
            "rowType": "Released",
            "ratecardVersionDisplay": "Current",
            "ratecardVersion": "308",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 41739
        }, {
            "packageId": 1631,
            "quarter": "3Q/2020",
            "sellingRotationId": 41740,
            "rowType": "Released",
            "ratecardVersionDisplay": "Current",
            "ratecardVersion": "308",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 41740
        }, {
            "packageId": 1631,
            "quarter": "3Q/2020",
            "sellingRotationId": 41737,
            "rowType": "Released",
            "ratecardVersionDisplay": "306.99",
            "ratecardVersion": "306",
            "ratecardRevision": "99",
            "priceBreakGroupingSellingRotationId": 41737
        }, {
            "packageId": 1631,
            "quarter": "3Q/2020",
            "sellingRotationId": 41738,
            "rowType": "Released",
            "ratecardVersionDisplay": "306.99",
            "ratecardVersion": "306",
            "ratecardRevision": "99",
            "priceBreakGroupingSellingRotationId": 41738
        }, {
            "packageId": 1631,
            "quarter": "3Q/2020",
            "sellingRotationId": 41739,
            "rowType": "Released",
            "ratecardVersionDisplay": "306.99",
            "ratecardVersion": "306",
            "ratecardRevision": "99",
            "priceBreakGroupingSellingRotationId": 41739
        }, {
            "packageId": 1631,
            "quarter": "3Q/2020",
            "sellingRotationId": 41740,
            "rowType": "Released",
            "ratecardVersionDisplay": "306.99",
            "ratecardVersion": "306",
            "ratecardRevision": "99",
            "priceBreakGroupingSellingRotationId": 41740
        }, {
            "packageId": 1631,
            "quarter": "4Q/2020",
            "sellingRotationId": 41737,
            "rowType": "Actual",
            "ratecardVersionDisplay": "Actual",
            "ratecardVersion": "317",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 41737
        }, {
            "packageId": 0,
            "quarter": "4Q/2020",
            "sellingRotationId": 44342,
            "rowType": "Actual",
            "ratecardVersionDisplay": "Actual",
            "ratecardVersion": "317",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 44342
        }, {
            "packageId": 1631,
            "quarter": "4Q/2020",
            "sellingRotationId": 41738,
            "rowType": "Actual",
            "ratecardVersionDisplay": "Actual",
            "ratecardVersion": "317",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 41738
        }, {
            "packageId": 1631,
            "quarter": "4Q/2020",
            "sellingRotationId": 41739,
            "rowType": "Actual",
            "ratecardVersionDisplay": "Actual",
            "ratecardVersion": "317",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 41739
        }, {
            "packageId": 1631,
            "quarter": "4Q/2020",
            "sellingRotationId": 41740,
            "rowType": "Actual",
            "ratecardVersionDisplay": "Actual",
            "ratecardVersion": "317",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 41740
        }, {
            "packageId": 1631,
            "quarter": "3Q/2020",
            "sellingRotationId": 41737,
            "rowType": "Actual",
            "ratecardVersionDisplay": "Actual",
            "ratecardVersion": "308",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 41737
        }, {
            "packageId": 0,
            "quarter": "3Q/2020",
            "sellingRotationId": 44342,
            "rowType": "Actual",
            "ratecardVersionDisplay": "Actual",
            "ratecardVersion": "308",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 44342
        }, {
            "packageId": 1631,
            "quarter": "3Q/2020",
            "sellingRotationId": 41738,
            "rowType": "Actual",
            "ratecardVersionDisplay": "Actual",
            "ratecardVersion": "308",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 41738
        }, {
            "packageId": 1631,
            "quarter": "3Q/2020",
            "sellingRotationId": 41739,
            "rowType": "Actual",
            "ratecardVersionDisplay": "Actual",
            "ratecardVersion": "308",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 41739
        }, {
            "packageId": 1631,
            "quarter": "3Q/2020",
            "sellingRotationId": 41740,
            "rowType": "Actual",
            "ratecardVersionDisplay": "Actual",
            "ratecardVersion": "308",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 41740
        }, {
            "packageId": 1631,
            "quarter": "4Q/2020",
            "sellingRotationId": 0,
            "rowType": "Package",
            "ratecardVersionDisplay": "Current",
            "ratecardVersion": "317",
            "ratecardRevision": "0"
        }, {
            "packageId": 1631,
            "quarter": "4Q/2020",
            "sellingRotationId": 0,
            "rowType": "Package (Working)",
            "ratecardVersionDisplay": "Working",
            "ratecardVersion": null,
            "ratecardRevision": null
        }, {
            "packageId": 1631,
            "quarter": "4Q/2020",
            "sellingRotationId": 0,
            "rowType": "Package",
            "ratecardVersionDisplay": "316.0",
            "ratecardVersion": "316",
            "ratecardRevision": "0"
        }, {
            "packageId": 1631,
            "quarter": "3Q/2020",
            "sellingRotationId": 0,
            "rowType": "Package",
            "ratecardVersionDisplay": "Current",
            "ratecardVersion": "308",
            "ratecardRevision": "0"
        }, {
            "packageId": 1631,
            "quarter": "3Q/2020",
            "sellingRotationId": 0,
            "rowType": "Package",
            "ratecardVersionDisplay": "306.99",
            "ratecardVersion": "306",
            "ratecardRevision": "99"
        }, {
            "packageId": 1631,
            "quarter": "4Q/2020",
            "sellingRotationId": 0,
            "rowType": "Package",
            "ratecardVersionDisplay": "Working",
            "ratecardVersion": null,
            "ratecardRevision": null
        }, {
            "packageId": 1631,
            "quarter": "4Q/2020",
            "sellingRotationId": 41738,
            "rowType": "Released",
            "ratecardVersionDisplay": "316.0",
            "ratecardVersion": "316",
            "ratecardRevision": "0",
            "priceBreakGroupingSellingRotationId": 41738
        }, {
            "packageId": 1631,
            "quarter": "4Q/2020",
            "sellingRotationId": 0,
            "rowType": "Package",
            "ratecardVersionDisplay": "Working",
            "ratecardVersion": null,
            "ratecardRevision": null
        }
        ];

        var originalRows = Array.from(gridRows);

        // Act
        var result = window.pricingEstimatesGrid.testingOnly.sortGridRows(gridRows);

        // Assert
        var expectedResult1 = originalRows[18];
        var expectedResult22 = originalRows[36];
        var expectedResult23 = originalRows[37];
        var expectedResult24 = originalRows[41];
        var expectedResult41 = originalRows[16];
        var expectedResult42 = originalRows[42];


        expect(JSON.stringify(result[0])).toEqual(JSON.stringify(expectedResult1));
        expect(JSON.stringify(result[22])).toEqual(JSON.stringify(expectedResult22));
        expect(JSON.stringify(result[23])).toEqual(JSON.stringify(expectedResult23));
        expect(JSON.stringify(result[24])).toEqual(JSON.stringify(expectedResult24));
        expect(JSON.stringify(result[41])).toEqual(JSON.stringify(expectedResult41));
        expect(JSON.stringify(result[42])).toEqual(JSON.stringify(expectedResult42));


        expect(JSON.stringify(result[14])).toBeTruthy();
    });

    it('sortGridRows correctly sorts array by package, year, quarter, selling rotation id, groupingSR, and rowType', () => {
        // Arrange
        var gridRows =
            [{
                "packageId": 0,
                "quarter": "1Q/2021",
                "sellingRotationId": 44516,
                "rowType": "Released",
                "ratecardVersionDisplay": "Current",
                "ratecardVersion": "317",
                "ratecardRevision": "00000",
                "priceBreakGroupingSellingRotationId": 22641
            }, {
                "packageId": 0,
                "quarter": "3Q/2021",
                "sellingRotationId": 44516,
                "rowType": "Released",
                "ratecardVersionDisplay": "Current",
                "ratecardVersion": "317",
                "ratecardRevision": "00000",
                "priceBreakGroupingSellingRotationId": 22641
            }, {
                "packageId": 0,
                "quarter": "1Q/2021",
                "sellingRotationId": 44516,
                "rowType": "Actual",
                "ratecardVersionDisplay": "Actual",
                "ratecardVersion": "317",
                "ratecardRevision": "00000",
                "priceBreakGroupingSellingRotationId": 22641
            }, {
                "packageId": 6176,
                "quarter": "2Q/2021",
                "sellingRotationId": 58156,
                "rowType": "Released",
                "ratecardVersionDisplay": "Current",
                "ratecardVersion": "416",
                "ratecardRevision": "00001",
                "priceBreakGroupingSellingRotationId": 41757
            }, {
                "packageId": 6176,
                "quarter": "2Q/2021",
                "sellingRotationId": 58157,
                "rowType": "Released",
                "ratecardVersionDisplay": "Current",
                "ratecardVersion": "416",
                "ratecardRevision": "00001",
                "priceBreakGroupingSellingRotationId": 42160
            }, {
                "packageId": 6176,
                "quarter": "2Q/2021",
                "sellingRotationId": 58155,
                "rowType": "Released",
                "ratecardVersionDisplay": "Current",
                "ratecardVersion": "416",
                "ratecardRevision": "00001",
                "priceBreakGroupingSellingRotationId": 798
            }, {
                "packageId": 6176,
                "quarter": "1Q/2021",
                "sellingRotationId": 58156,
                "rowType": "Released",
                "ratecardVersionDisplay": "Current",
                "ratecardVersion": "416",
                "ratecardRevision": "00001",
                "priceBreakGroupingSellingRotationId": 41757
            }, {
                "packageId": 6176,
                "quarter": "1Q/2021",
                "sellingRotationId": 58157,
                "rowType": "Released",
                "ratecardVersionDisplay": "Current",
                "ratecardVersion": "416",
                "ratecardRevision": "00001",
                "priceBreakGroupingSellingRotationId": 42160
            }, {
                "packageId": 6176,
                "quarter": "1Q/2021",
                "sellingRotationId": 58155,
                "rowType": "Released",
                "ratecardVersionDisplay": "Current",
                "ratecardVersion": "416",
                "ratecardRevision": "00001",
                "priceBreakGroupingSellingRotationId": 798
            }, {
                "packageId": 6176,
                "quarter": "1Q/2021",
                "sellingRotationId": 58156,
                "rowType": "Actual",
                "ratecardVersionDisplay": "Actual",
                "ratecardVersion": "416",
                "ratecardRevision": "00001",
                "priceBreakGroupingSellingRotationId": 41757
            }, {
                "packageId": 6176,
                "quarter": "1Q/2021",
                "sellingRotationId": 58157,
                "rowType": "Actual",
                "ratecardVersionDisplay": "Actual",
                "ratecardVersion": "416",
                "ratecardRevision": "00001",
                "priceBreakGroupingSellingRotationId": 42160
            }, {
                "packageId": 6176,
                "quarter": "1Q/2021",
                "sellingRotationId": 58155,
                "rowType": "Actual",
                "ratecardVersionDisplay": "Actual",
                "ratecardVersion": "416",
                "ratecardRevision": "00001",
                "priceBreakGroupingSellingRotationId": 798
            }, {
                "packageId": 6176,
                "quarter": "3Q/2021",
                "sellingRotationId": 58156,
                "rowType": "Working (Draft)",
                "ratecardVersionDisplay": "Working (Draft)",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "priceBreakGroupingSellingRotationId": 41757
            }, {
                "packageId": 0,
                "quarter": "2Q/2021",
                "sellingRotationId": 56278,
                "rowType": "Working (Draft)",
                "ratecardVersionDisplay": "Working (Draft)",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "priceBreakGroupingSellingRotationId": 22641
            }, {
                "packageId": 0,
                "quarter": "1Q/2021",
                "sellingRotationId": 56278,
                "rowType": "Working (Draft)",
                "ratecardVersionDisplay": "Working (Draft)",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "priceBreakGroupingSellingRotationId": 22641
            }, {
                "packageId": 0,
                "quarter": "2Q/2021",
                "sellingRotationId": 55627,
                "rowType": "Working (Draft)",
                "ratecardVersionDisplay": "Working (Draft)",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "priceBreakGroupingSellingRotationId": 55627
            }, {
                "packageId": 0,
                "quarter": "1Q/2021",
                "sellingRotationId": 55627,
                "rowType": "Working (Draft)",
                "ratecardVersionDisplay": "Working (Draft)",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "priceBreakGroupingSellingRotationId": 55627
            }, {
                "packageId": 0,
                "quarter": "3Q/2021",
                "sellingRotationId": 55628,
                "rowType": "Working (Draft)",
                "ratecardVersionDisplay": "Working (Draft)",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "priceBreakGroupingSellingRotationId": 43086
            }, {
                "packageId": 0,
                "quarter": "2Q/2021",
                "sellingRotationId": 55628,
                "rowType": "Working (Draft)",
                "ratecardVersionDisplay": "Working (Draft)",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "priceBreakGroupingSellingRotationId": 43086
            }, {
                "packageId": 0,
                "quarter": "1Q/2021",
                "sellingRotationId": 55628,
                "rowType": "Working (Draft)",
                "ratecardVersionDisplay": "Working (Draft)",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "priceBreakGroupingSellingRotationId": 43086
            }, {
                "packageId": 6176,
                "quarter": "3Q/2021",
                "sellingRotationId": 58157,
                "rowType": "Working (Draft)",
                "ratecardVersionDisplay": "Working (Draft)",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "priceBreakGroupingSellingRotationId": 42160
            }, {
                "packageId": 6176,
                "quarter": "3Q/2021",
                "sellingRotationId": 58155,
                "rowType": "Working (Draft)",
                "ratecardVersionDisplay": "Working (Draft)",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "priceBreakGroupingSellingRotationId": 798
            }, {
                "packageId": 0,
                "quarter": "3Q/2021",
                "sellingRotationId": 55629,
                "rowType": "Working (Draft)",
                "ratecardVersionDisplay": "Working (Draft)",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "priceBreakGroupingSellingRotationId": 22641
            }, {
                "packageId": 0,
                "quarter": "2Q/2021",
                "sellingRotationId": 55629,
                "rowType": "Working (Draft)",
                "ratecardVersionDisplay": "Working (Draft)",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "priceBreakGroupingSellingRotationId": 22641
            }, {
                "packageId": 0,
                "quarter": "1Q/2021",
                "sellingRotationId": 55629,
                "rowType": "Working (Draft)",
                "ratecardVersionDisplay": "Working (Draft)",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "priceBreakGroupingSellingRotationId": 22641
            }, {
                "packageId": 0,
                "quarter": "1Q/2021",
                "sellingRotationId": 56278,
                "rowType": "Actual",
                "ratecardVersionDisplay": "Actual",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "priceBreakGroupingSellingRotationId": 22641
            }, {
                "packageId": 0,
                "quarter": "1Q/2021",
                "sellingRotationId": 55627,
                "rowType": "Actual",
                "ratecardVersionDisplay": "Actual",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "priceBreakGroupingSellingRotationId": 55627
            }, {
                "packageId": 0,
                "quarter": "1Q/2021",
                "sellingRotationId": 55628,
                "rowType": "Actual",
                "ratecardVersionDisplay": "Actual",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "priceBreakGroupingSellingRotationId": 43086
            }, {
                "packageId": 0,
                "quarter": "1Q/2021",
                "sellingRotationId": 55629,
                "rowType": "Actual",
                "ratecardVersionDisplay": "Actual",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "priceBreakGroupingSellingRotationId": 22641
            }, {
                "packageId": 0,
                "quarter": "1Q/2021",
                "sellingRotationId": 44516,
                "rowType": "Working",
                "ratecardVersionDisplay": "Working",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "priceBreakGroupingSellingRotationId": 22641
            }, {
                "packageId": 6176,
                "quarter": "1Q/2021",
                "sellingRotationId": 58156,
                "rowType": "Working",
                "ratecardVersionDisplay": "Working",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "priceBreakGroupingSellingRotationId": 41757
            }, {
                "packageId": 6176,
                "quarter": "1Q/2021",
                "sellingRotationId": 58157,
                "rowType": "Working",
                "ratecardVersionDisplay": "Working",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "priceBreakGroupingSellingRotationId": 42160
            }, {
                "packageId": 6176,
                "quarter": "1Q/2021",
                "sellingRotationId": 58155,
                "rowType": "Working",
                "ratecardVersionDisplay": "Working",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "priceBreakGroupingSellingRotationId": 798
            }, {
                "packageId": 0,
                "quarter": "3Q/2021",
                "sellingRotationId": 44516,
                "rowType": "Working",
                "ratecardVersionDisplay": "Working",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "priceBreakGroupingSellingRotationId": 22641
            }, {
                "packageId": 6176,
                "quarter": "2Q/2021",
                "sellingRotationId": 58156,
                "rowType": "Working",
                "ratecardVersionDisplay": "Working",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "priceBreakGroupingSellingRotationId": 41757
            }, {
                "packageId": 6176,
                "quarter": "2Q/2021",
                "sellingRotationId": 58157,
                "rowType": "Working",
                "ratecardVersionDisplay": "Working",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "priceBreakGroupingSellingRotationId": 42160
            }, {
                "packageId": 6176,
                "quarter": "2Q/2021",
                "sellingRotationId": 58155,
                "rowType": "Working",
                "ratecardVersionDisplay": "Working",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "priceBreakGroupingSellingRotationId": 798
            }, {
                "packageId": 6176,
                "quarter": "2Q/2021",
                "sellingRotationId": 0,
                "rowType": "Package",
                "ratecardVersionDisplay": "Current",
                "ratecardVersion": "416",
                "ratecardRevision": "00001",
                "priceBreakGroupingSellingRotationId": ""
            }, {
                "packageId": 6176,
                "quarter": "1Q/2021",
                "sellingRotationId": 0,
                "rowType": "Package",
                "ratecardVersionDisplay": "Current",
                "ratecardVersion": "416",
                "ratecardRevision": "00001",
                "priceBreakGroupingSellingRotationId": ""
            }, {
                "packageId": 6176,
                "quarter": "1Q/2021",
                "sellingRotationId": 0,
                "rowType": "Package (Actual)",
                "ratecardVersionDisplay": "Actual",
                "ratecardVersion": "416",
                "ratecardRevision": "00001",
                "priceBreakGroupingSellingRotationId": ""
            }, {
                "packageId": 6176,
                "quarter": "3Q/2021",
                "sellingRotationId": 0,
                "rowType": "Package (Working)",
                "ratecardVersionDisplay": "Working",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "priceBreakGroupingSellingRotationId": ""
            }, {
                "packageId": 6176,
                "quarter": "1Q/2021",
                "sellingRotationId": 0,
                "rowType": "Package (Working)",
                "ratecardVersionDisplay": "Working",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "priceBreakGroupingSellingRotationId": ""
            }, {
                "packageId": 6176,
                "quarter": "2Q/2021",
                "sellingRotationId": 0,
                "rowType": "Package (Working)",
                "ratecardVersionDisplay": "Working",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "priceBreakGroupingSellingRotationId": ""
            }
            ]
            ;

        var originalRows = Array.from(gridRows);

        // Act
        var result = window.pricingEstimatesGrid.testingOnly.sortGridRows(gridRows);

        // Assert
        var expectedResult1 = originalRows[0];
        var expectedResult15 = originalRows[1];
        // these are selling rotations 55629 and 55628 and are inverted in order because their grouping selling rotations are 22641 and 43086 respectively
        var expectedResult17 = originalRows[22];
        var expectedResult18 = originalRows[17];
        // package actual row
        var expectedResult21 = originalRows[39];
        var resultWithoutOrdinals = result.slice();

        // ordinal is added in for additional sorting properties and will mess up the stringify for the expect
        resultWithoutOrdinals.forEach(x => x.ordinal = undefined);

        expect(parseInt(result[0].quarter.charAt(0))).toEqual(parseInt(expectedResult1.quarter.charAt(0)));
        expect(parseInt(result[0].quarter.substr(3))).toEqual(parseInt(expectedResult1.quarter.substr(3)));

        expect(parseInt(result[15].quarter.charAt(0))).toEqual(parseInt(expectedResult15.quarter.charAt(0)));
        expect(parseInt(result[15].quarter.substr(3))).toEqual(parseInt(expectedResult15.quarter.substr(3)));

        expect(expectedResult17.priceBreakGroupingSellingRotationId).toBeLessThanOrEqual(expectedResult18.priceBreakGroupingSellingRotationId);

        expect(resultWithoutOrdinals[21].packageId).toEqual(expectedResult21.packageId);

        expect(parseInt(resultWithoutOrdinals[21].quarter.charAt(0))).toEqual(parseInt(expectedResult21.quarter.charAt(0)));
        expect(parseInt(resultWithoutOrdinals[21].quarter.substr(3))).toEqual(parseInt(expectedResult21.quarter.substr(3)));
        
    });

    it('sortGridRows puts current removed at bottom', () => {
        // Arrange
        var gridRows =
            [{
                    "packageId": 5850,
                    "quarter": "4Q/2021",
                    "sellingRotationId": 57294,
                    "rowType": "Current (Removed)",
                    "ratecardVersionDisplay": "Current (Removed)",
                    "ratecardVersion": "393",
                    "ratecardRevision": "00005",
                    "priceBreakGroupingSellingRotationId": ""
                }, {
                    "packageId": 5850,
                    "quarter": "4Q/2021",
                    "sellingRotationId": 57289,
                    "rowType": "Released",
                    "ratecardVersionDisplay": "393.00005",
                    "ratecardVersion": "393",
                    "ratecardRevision": "00005",
                    "priceBreakGroupingSellingRotationId": ""
                }, {
                    "packageId": 0,
                    "quarter": "4Q/2021",
                    "sellingRotationId": 57294,
                    "rowType": "Working (Draft)",
                    "ratecardVersionDisplay": "Working (Draft)",
                    "ratecardVersion": null,
                    "ratecardRevision": null,
                    "priceBreakGroupingSellingRotationId": ""
                }, {
                    "packageId": 5850,
                    "quarter": "4Q/2021",
                    "sellingRotationId": 0,
                    "rowType": "Package",
                    "ratecardVersionDisplay": "393.00005",
                    "ratecardVersion": "393",
                    "ratecardRevision": "00005",
                    "priceBreakGroupingSellingRotationId": ""
                }
            ]
            ;

        var originalRows = Array.from(gridRows);

        // Act
        var result = window.pricingEstimatesGrid.testingOnly.sortGridRows(gridRows);

        // Assert
        var expectedResult1 = originalRows[2];
        var expectedResult2 = originalRows[3];
        var expectedResult3 = originalRows[1];
        var expectedResult4 = originalRows[0];
        var resultWithoutOrdinals = result.slice();

        // ordinal is added in for additional sorting properties and will mess up the stringify for the expect
        resultWithoutOrdinals.forEach(x => x.ordinal = undefined);

        expect(JSON.stringify(resultWithoutOrdinals[0])).toEqual(JSON.stringify(expectedResult1));
        expect(JSON.stringify(resultWithoutOrdinals[1])).toEqual(JSON.stringify(expectedResult2));
        expect(JSON.stringify(resultWithoutOrdinals[2])).toEqual(JSON.stringify(expectedResult3));
        expect(JSON.stringify(resultWithoutOrdinals[3])).toEqual(JSON.stringify(expectedResult4));
    });

    it('sortGridRows with multiple delivery streams does not introduce duplicates', () => {
        // Arrange
        var gridRows =
            [{
                "packageId": 5850,
                "quarter": "4Q/2021",
                "sellingRotationId": 57294,
                "rowType": "Current (Removed)",
                "ratecardVersionDisplay": "Current (Removed)",
                "ratecardVersion": "393",
                "ratecardRevision": "00005",
                "priceBreakGroupingSellingRotationId": ""
            }, {
                    "packageId": 5850,
                    "quarter": "4Q/2021",
                    "sellingRotationId": 57289,
                    "rowType": "Released",
                    "ratecardVersionDisplay": "393.00005",
                    "ratecardVersion": "393",
                    "ratecardRevision": "00005",
                    "priceBreakGroupingSellingRotationId": ""
                }, {
                    "packageId": 5850,
                    "quarter": "4Q/2021",
                    "sellingRotationId": 57294,
                    "rowType": "Current (Removed)",
                    "ratecardVersionDisplay": "Current (Removed)",
                    "ratecardVersion": "393",
                    "ratecardRevision": "00005",
                    "priceBreakGroupingSellingRotationId": ""
                }, {
                    "packageId": 5850,
                    "quarter": "4Q/2021",
                    "sellingRotationId": 57289,
                    "rowType": "Released",
                    "ratecardVersionDisplay": "393.00005",
                    "ratecardVersion": "393",
                    "ratecardRevision": "00005",
                    "priceBreakGroupingSellingRotationId": ""
                }, {
                    "packageId": 5850,
                    "quarter": "4Q/2021",
                    "sellingRotationId": 57294,
                    "rowType": "Current (Removed)",
                    "ratecardVersionDisplay": "Current (Removed)",
                    "ratecardVersion": "393",
                    "ratecardRevision": "00005",
                    "priceBreakGroupingSellingRotationId": ""
                }, {
                    "packageId": 5850,
                    "quarter": "4Q/2021",
                    "sellingRotationId": 57289,
                    "rowType": "Released",
                    "ratecardVersionDisplay": "393.00005",
                    "ratecardVersion": "393",
                    "ratecardRevision": "00005",
                    "priceBreakGroupingSellingRotationId": ""
                }, {
                    "packageId": 5850,
                    "quarter": "4Q/2021",
                    "sellingRotationId": 57294,
                    "rowType": "Current (Removed)",
                    "ratecardVersionDisplay": "Current (Removed)",
                    "ratecardVersion": "393",
                    "ratecardRevision": "00005",
                    "priceBreakGroupingSellingRotationId": ""
                }, {
                    "packageId": 5850,
                    "quarter": "4Q/2021",
                    "sellingRotationId": 57289,
                    "rowType": "Released",
                    "ratecardVersionDisplay": "393.00005",
                    "ratecardVersion": "393",
                    "ratecardRevision": "00005",
                    "priceBreakGroupingSellingRotationId": ""
                }, {
                    "packageId": 0,
                    "quarter": "4Q/2021",
                    "sellingRotationId": 57294,
                    "rowType": "Working (Draft)",
                    "ratecardVersionDisplay": "Working (Draft)",
                    "ratecardVersion": null,
                    "ratecardRevision": null,
                    "priceBreakGroupingSellingRotationId": ""
                }, {
                    "packageId": 0,
                    "quarter": "4Q/2021",
                    "sellingRotationId": 57294,
                    "rowType": "Working (Draft)",
                    "ratecardVersionDisplay": "Working (Draft)",
                    "ratecardVersion": null,
                    "ratecardRevision": null,
                    "priceBreakGroupingSellingRotationId": ""
                }, {
                    "packageId": 0,
                    "quarter": "4Q/2021",
                    "sellingRotationId": 57294,
                    "rowType": "Working (Draft)",
                    "ratecardVersionDisplay": "Working (Draft)",
                    "ratecardVersion": null,
                    "ratecardRevision": null,
                    "priceBreakGroupingSellingRotationId": ""
                }, {
                    "packageId": 0,
                    "quarter": "4Q/2021",
                    "sellingRotationId": 57294,
                    "rowType": "Working (Draft)",
                    "ratecardVersionDisplay": "Working (Draft)",
                    "ratecardVersion": null,
                    "ratecardRevision": null,
                    "priceBreakGroupingSellingRotationId": ""
                }, {
                    "packageId": 5850,
                    "quarter": "4Q/2021",
                    "sellingRotationId": 0,
                    "rowType": "Package",
                    "ratecardVersionDisplay": "393.00005",
                    "ratecardVersion": "393",
                    "ratecardRevision": "00005",
                    "priceBreakGroupingSellingRotationId": ""
                }, {
                    "packageId": 5850,
                    "quarter": "4Q/2021",
                    "sellingRotationId": 0,
                    "rowType": "Package",
                    "ratecardVersionDisplay": "393.00005",
                    "ratecardVersion": "393",
                    "ratecardRevision": "00005",
                    "priceBreakGroupingSellingRotationId": ""
                }, {
                    "packageId": 5850,
                    "quarter": "4Q/2021",
                    "sellingRotationId": 0,
                    "rowType": "Package",
                    "ratecardVersionDisplay": "393.00005",
                    "ratecardVersion": "393",
                    "ratecardRevision": "00005",
                    "priceBreakGroupingSellingRotationId": ""
                }, {
                    "packageId": 5850,
                    "quarter": "4Q/2021",
                    "sellingRotationId": 0,
                    "rowType": "Package",
                    "ratecardVersionDisplay": "393.00005",
                    "ratecardVersion": "393",
                    "ratecardRevision": "00005",
                    "priceBreakGroupingSellingRotationId": ""
                }
            ]
            ;

        var originalRows = Array.from(gridRows);

        // Act
        var result = window.pricingEstimatesGrid.testingOnly.sortGridRows(gridRows);

        // Assert
        expect(originalRows.length).toEqual(result.length);
    });

    it('initializeRatecardIdDropdown puts first ratecard as selected', async () => {
        // Arrange
        const ajaxStub = sinon.stub().resolves([
            {
                Id: "1",
                Description: "Test1"
            },
            {
                Id: "2",
                Description: "Test2"
            }
        ]);

        sinon.replace(window.rateCard, 'ajax', ajaxStub);

        pricingEstimatesGrid.testingOnly.setSearchViewModel({ RatecardId: param => { } });

        // Act
        await window.pricingEstimatesGrid.testingOnly.initializeRatecardIdDropdown();

        // Assert
        var dropdown = document.getElementById('RatecardId').options;
        var index = document.getElementById('RatecardId').options.selectedIndex;
        expect(index).toEqual(0);
        expect(dropdown[index].value).toEqual("1");
    });

    it('initializeRatecardIdDropdown puts unique ratecard as selected', async () => {
        // Arrange
        const ajaxStub = sinon.stub().resolves([
            {
                Id: "3",
                Description: "Test3"
            }
        ]);

        sinon.replace(window.rateCard, 'ajax', ajaxStub);

        pricingEstimatesGrid.testingOnly.setSearchViewModel({ RatecardId: param => {} });

        // Act
        await window.pricingEstimatesGrid.testingOnly.initializeRatecardIdDropdown();


        // Assert
        var dropdown = document.getElementById('RatecardId').options;
        var index = document.getElementById('RatecardId').options.selectedIndex;
        expect(index).toEqual(0);
        expect(dropdown[index].value).toEqual("3");
    });

    it('ReleaseRatecardViewModel properties are set when release ratecard button is clicked', async () => {
        // Arrange
        var fakeApplyBindings = sinon.fake.returns(() => { });
        sinon.replace(window.ko, 'applyBindings', fakeApplyBindings);

        var fakeGetSelectedRowItems = sinon.fake.returns(param => [
            {
                rowType: "Working (Draft)"
            }
        ]);
        sinon.replace(window.slickGridCommon, 'getSelectedRowItems', fakeGetSelectedRowItems());

        var fakeGetAffectedEstimates = sinon.fake.returns((param1, param2) => [
            {
                entityId: 123,
                isWorking: () => true,
                getDataForRelease: () => {
                    return {
                        data: 'something'
                    };
                }
            }
        ]);
        sinon.replace(window.Slick.Data, 'getAffectedEstimates', fakeGetAffectedEstimates());

        var ratecardVersion = 2;
        var ratecardRevision = 1;
        var defaultIsMajorRelease = false;
        const ajaxStub = sinon.stub().resolves({
            Version: ratecardVersion,
            Revision: ratecardRevision
        });
        sinon.replace(window.rateCard, 'ajax', ajaxStub);

        var expectedReleaseVersionText = `${ratecardVersion}.0000${ratecardRevision + 1}`;
        var releaseRateCardButton = $('#releaseRateCard');

        const fake = sinon.fake.returns(() => {});
        pricingEstimatesGrid.testingOnly.override.initializeSellingRotationsDropdown(fake);
        pricingEstimatesGrid.testingOnly.override.initializePackageDropdown(fake);
        pricingEstimatesGrid.testingOnly.override.initializeDeliveryStreamDropdown(fake);
        pricingEstimatesGrid.testingOnly.override.initializeRatecardIdDropdown(fake);
        pricingEstimatesGrid.testingOnly.override.initializeCategorySubcategoryDropdown(fake);
        pricingEstimatesGrid.testingOnly.override.initializeProgramCategoriesAndCodesDropdown(fake);
        pricingEstimatesGrid.testingOnly.initialize();

        // Act
        await releaseRateCardButton.click();

        // Assert
        var releaseRatecardViewModel = pricingEstimatesGrid.testingOnly.getReleaseRatecardViewModel();
        expect(releaseRatecardViewModel.releaseVersion()).toEqual(expectedReleaseVersionText);
        expect(releaseRatecardViewModel.ratecardVersion()).toEqual(ratecardVersion);
        expect(releaseRatecardViewModel.ratecardRevision()).toEqual(ratecardRevision);
        expect(releaseRatecardViewModel.isMajorRelease()).toEqual(defaultIsMajorRelease);
    });

    it('Rollover button populates quarters when is clicked', async () => {

        // Arrange
        var fakeGetSelectedRowItems = sinon.fake.returns(param => [
            {
                rowType: "Working"
            }
        ]);

        sinon.replace(window.slickGridCommon, 'getSelectedRowItems', fakeGetSelectedRowItems());
        var rolloverButton = $('#rolloverEstimates');

        var spy = {
            sourceQuarters: param => {},
            targetQuarters: param => {}
        };

        spyOn(spy, 'sourceQuarters');
        spyOn(spy, 'targetQuarters');
        var fakeRolloverEstimatesViewModel = {
            sourceQuarters: spy.sourceQuarters,
            targetQuarters: spy.targetQuarters
        };

        pricingEstimatesGrid.testingOnly.setRolloverEstimatesViewModel(fakeRolloverEstimatesViewModel);
        sinon.replace(window.rolloverEstimates, 'open', (param1, param2) => {});

        // Act
        await rolloverButton.click();

        // Assert
        expect(spy.sourceQuarters).toHaveBeenCalled();
        expect(spy.targetQuarters).toHaveBeenCalled();
    });

    it('initializeRolloverButton sets the button as enable when feature flag RolloverButtonEnable is true', async () => {
        // Arrange
        const isRolloverButtonEnable = true;

        const ajaxStub = sinon.stub().resolves({
            Name: "Test",
            IsEnabled: isRolloverButtonEnable
        });

        sinon.replace(window.rateCard, 'ajax', ajaxStub);

        var viewModel = new viewModels.PricingEstimatesToolbarViewModel();
        expect(viewModel.rolloverButtonEnable()).toEqual(false);

        pricingEstimatesGrid.testingOnly.setToolbarViewModel(viewModel);

        // Act
        await window.pricingEstimatesGrid.testingOnly.initializeRolloverButton();

        // Assert
        expect(viewModel.rolloverButtonEnable()).toEqual(isRolloverButtonEnable);
    });
    
    it('Testing sortByPricePeriodCriteria method which sort by pricePeriod criteria', () => {
        // Arrange
        var packageGroupedRows =    [
            {
                "id": "C32216809Working (Draft)",
                "entityId": 2216809,
                "deliveryStream": "C3",
                "sellingRotationId": 54109,
                "name": "Ernesto Sorting By pricePeriod",
                "active": true,
                "quarter": "1Q/2022",
                "priceBreakName": "",
                "priceBreakGroupingSellingRotationId": "",
                "priceBreakFlight": "02/28/2022 - 03/27/2022",
                "pricePeriodFlight": "02/28/2022 - 03/27/2022",
                "outOfSale": false,
                "outlet": "ABC",
                "outletId": 30,
                "rateCardId": 1,
                "ratecard": "Sales Estimate",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "releaseDate": null,
                "releaseNotes": null,
                "daypart": "A - M-SU 6P-12A",
                "category": {
                    "Id": 8863,
                    "Code": "AM",
                    "Name": "ACQUIRED MOVIES",
                    "Description": "ACQUIRED MOV",
                    "IsLive": false,
                    "TotalHomeAdjustmentFactor": 0,
                    "EffectiveDate": "2021-03-11T00:00:00",
                    "ExpiryDate": null,
                    "Notes": "c209312a-2474-4e91-a361-fd9d336782c2",
                    "LastModifiedBy": "c209312a-2474-4e91-a361-fd9d336782c2",
                    "LastModifiedDate": "2021-03-11T08:00:12",
                    "IsUsed": false,
                    "ParentCategoryId": null,
                    "ParentCategoryCode": null,
                    "ParentCategoryName": null,
                    "ParentCategoryDescription": null
                },
                "subcategory": {
                    "Id": 8881,
                    "Code": "AM",
                    "Name": "ACQUIRED MOVIES",
                    "Description": "ACQUIRED MOVIES",
                    "IsLive": false,
                    "TotalHomeAdjustmentFactor": 0,
                    "EffectiveDate": "2021-03-11T00:00:00",
                    "ExpiryDate": null,
                    "Notes": "c209312a-2474-4e91-a361-fd9d336782c2",
                    "LastModifiedBy": "c209312a-2474-4e91-a361-fd9d336782c2",
                    "LastModifiedDate": "2021-03-11T08:00:36",
                    "IsUsed": false,
                    "ParentCategoryId": 8863,
                    "ParentCategoryCode": "AM",
                    "ParentCategoryName": "ACQUIRED MOVIES",
                    "ParentCategoryDescription": "ACQUIRED MOV"
                },
                "packageId": 3115,
                "primary": true,
                "live": false,
                "rate": 0,
                "isCurrent": false,
                "visible": true,
                "rowType": "Working (Draft)",
                "comments": null,
                "multiOutlet": false,
                "sourceType": "",
                "aopDemo": null,
                "aopCpm": 0,
                "aopRate": 0,
                "aopImp": 0,
                "packagePeriodVersionId": 11653,
                "priceBreakStart": "2022-02-28T00:00:00",
                "priceBreakEnd": "2022-03-27T00:00:00",
                "pricePeriodName": "PB4",
                "pricePeriodStartDate": "2022-02-28T00:00:00",
                "pricePeriodEndDate": "2022-03-27T00:00:00",
                "isPackage": false,
                "aopImps": 0,
                "ratecardVersionDisplay": "Working (Draft)",
                "categoryDisplay": "ACQUIRED MOVIES",
                "subcategoryDisplay": "ACQUIRED MOVIES",
                "packaged": true,
                "selected": false,
                "packageIsCollapsed": false,
                "sellingRotationsAreHidden": false
            },
            {
                "id": "PL2216805Working (Draft)",
                "entityId": 2216805,
                "deliveryStream": "PL",
                "sellingRotationId": 54109,
                "name": "Ernesto Sorting By pricePeriod",
                "active": true,
                "quarter": "1Q/2022",
                "priceBreakName": "",
                "priceBreakGroupingSellingRotationId": "",
                "priceBreakFlight": "01/10/2022 - 01/23/2022",
                "pricePeriodFlight": "01/10/2022 - 01/23/2022",
                "outOfSale": false,
                "outlet": "ABC",
                "outletId": 30,
                "rateCardId": 1,
                "ratecard": "Sales Estimate",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "releaseDate": null,
                "releaseNotes": null,
                "daypart": "A - M-SU 6P-12A",
                "category": {
                    "Id": 8863,
                    "Code": "AM",
                    "Name": "ACQUIRED MOVIES",
                    "Description": "ACQUIRED MOV",
                    "IsLive": false,
                    "TotalHomeAdjustmentFactor": 0,
                    "EffectiveDate": "2021-03-11T00:00:00",
                    "ExpiryDate": null,
                    "Notes": "c209312a-2474-4e91-a361-fd9d336782c2",
                    "LastModifiedBy": "c209312a-2474-4e91-a361-fd9d336782c2",
                    "LastModifiedDate": "2021-03-11T08:00:12",
                    "IsUsed": false,
                    "ParentCategoryId": null,
                    "ParentCategoryCode": null,
                    "ParentCategoryName": null,
                    "ParentCategoryDescription": null
                },
                "subcategory": {
                    "Id": 8881,
                    "Code": "AM",
                    "Name": "ACQUIRED MOVIES",
                    "Description": "ACQUIRED MOVIES",
                    "IsLive": false,
                    "TotalHomeAdjustmentFactor": 0,
                    "EffectiveDate": "2021-03-11T00:00:00",
                    "ExpiryDate": null,
                    "Notes": "c209312a-2474-4e91-a361-fd9d336782c2",
                    "LastModifiedBy": "c209312a-2474-4e91-a361-fd9d336782c2",
                    "LastModifiedDate": "2021-03-11T08:00:36",
                    "IsUsed": false,
                    "ParentCategoryId": 8863,
                    "ParentCategoryCode": "AM",
                    "ParentCategoryName": "ACQUIRED MOVIES",
                    "ParentCategoryDescription": "ACQUIRED MOV"
                },
                "packageId": 3115,
                "primary": true,
                "live": false,
                "rate": 0,
                "isCurrent": false,
                "visible": true,
                "rowType": "Working (Draft)",
                "comments": null,
                "multiOutlet": false,
                "sourceType": "",
                "aopDemo": null,
                "aopCpm": 0,
                "aopRate": 0,
                "aopImp": 0,
                "packagePeriodVersionId": 11653,
                "priceBreakStart": "2022-01-10T00:00:00",
                "priceBreakEnd": "2022-01-23T00:00:00",
                "pricePeriodName": "PB2",
                "pricePeriodStartDate": "2022-01-10T00:00:00",
                "pricePeriodEndDate": "2022-01-23T00:00:00",
                "isPackage": false,
                "aopImps": 0,
                "ratecardVersionDisplay": "Working (Draft)",
                "categoryDisplay": "ACQUIRED MOVIES",
                "subcategoryDisplay": "ACQUIRED MOVIES",
                "packaged": true,
                "selected": false,
                "packageIsCollapsed": false,
                "sellingRotationsAreHidden": false
            },
            {
                "id": "PL2216803Package (Working)",
                "entityId": 2216803,
                "deliveryStream": "PL",
                "sellingRotationId": 0,
                "name": "Ernesto sorting by pricePeriod",
                "active": true,
                "quarter": "1Q/2022",
                "priceBreakName": "",
                "priceBreakGroupingSellingRotationId": "",
                "priceBreakFlight": "",
                "pricePeriodFlight": "12/27/2021 - 01/09/2022",
                "outOfSale": false,
                "outlet": "ABC",
                "outletId": 30,
                "rateCardId": 1,
                "ratecard": "Sales Estimate",
                "ratecardVersion": null,
                "ratecardRevision": null,
                "releaseDate": null,
                "releaseNotes": null,
                "daypart": "",
                "category": {
                    "Id": 8863,
                    "Code": "AM",
                    "Name": "ACQUIRED MOVIES",
                    "Description": "ACQUIRED MOV",
                    "IsLive": false,
                    "TotalHomeAdjustmentFactor": 0,
                    "EffectiveDate": "2021-03-11T00:00:00",
                    "ExpiryDate": null,
                    "Notes": "c209312a-2474-4e91-a361-fd9d336782c2",
                    "LastModifiedBy": "c209312a-2474-4e91-a361-fd9d336782c2",
                    "LastModifiedDate": "2021-03-11T08:00:12",
                    "IsUsed": false,
                    "ParentCategoryId": null,
                    "ParentCategoryCode": null,
                    "ParentCategoryName": null,
                    "ParentCategoryDescription": null
                },
                "subcategory": {
                    "Id": 8881,
                    "Code": "AM",
                    "Name": "ACQUIRED MOVIES",
                    "Description": "ACQUIRED MOVIES",
                    "IsLive": false,
                    "TotalHomeAdjustmentFactor": 0,
                    "EffectiveDate": "2021-03-11T00:00:00",
                    "ExpiryDate": null,
                    "Notes": "c209312a-2474-4e91-a361-fd9d336782c2",
                    "LastModifiedBy": "c209312a-2474-4e91-a361-fd9d336782c2",
                    "LastModifiedDate": "2021-03-11T08:00:36",
                    "IsUsed": false,
                    "ParentCategoryId": 8863,
                    "ParentCategoryCode": "AM",
                    "ParentCategoryName": "ACQUIRED MOVIES",
                    "ParentCategoryDescription": "ACQUIRED MOV"
                },
                "packageId": 3115,
                "primary": false,
                "live": false,
                "rate": 0,
                "isCurrent": false,
                "visible": true,
                "rowType": "Package (Working)",
                "comments": null,
                "multiOutlet": false,
                "sourceType": "",
                "aopDemo": null,
                "aopCpm": 0,
                "aopRate": 0,
                "aopImp": 0,
                "packagePeriodVersionId": null,
                "priceBreakStart": null,
                "priceBreakEnd": null,
                "pricePeriodName": "PB1",
                "pricePeriodStartDate": "2021-12-27T00:00:00",
                "pricePeriodEndDate": "2022-01-09T00:00:00",
                "isPackage": true,
                "aopImps": 0,
                "ratecardVersionDisplay": "Working",
                "categoryDisplay": "ACQUIRED MOVIES",
                "subcategoryDisplay": "ACQUIRED MOVIES",
                "packaged": true,
                "selected": false,
                "packageIsCollapsed": false,
                "sellingRotationsAreHidden": false
            }
        ];
        
        // Act
        window.pricingEstimatesGrid.testingOnly.sortByPricePeriodCriteria(packageGroupedRows);

        // Assert
        var firstPP= new Date(packageGroupedRows[0].pricePeriodStartDate).getTime();
        var secondPP= new Date(packageGroupedRows[1].pricePeriodStartDate).getTime();
        var thirdPP= new Date(packageGroupedRows[2].pricePeriodStartDate).getTime();

        expect(firstPP).toBeLessThan(secondPP);
        expect(secondPP).toBeLessThan(thirdPP);
    });
    
    it('sortGridRows correctly sorts array by package, year, quarter, selling rotation id, and pricePeriods', () => {
        // Arrange
        var gridRows = [
            {
              "id": "C32209227Released",
              "eid": 2209227,
              "packageId": 0,
              "quarter": "3Q/2021",
              "sellingRotationId": 46013,
              "rowType": "Released",
              "ratecardVersionDisplay": "Current",
              "ratecardVersion": "406",
              "ratecardRevision": "00000",
              "pricePeriodName": "3Q2021",
              "pricePeriodStartDate": "2021-06-28T00:00:00",
              "pricePeriodEndDate": "2021-09-26T00:00:00",
              "priceBreakStart": "2021-06-28T00:00:00",
              "priceBreakEnd": "2021-09-26T00:00:00"
            },
            {
              "id": "C3-2209227Working",
              "eid": -2209227,
              "packageId": 0,
              "quarter": "3Q/2021",
              "sellingRotationId": 46013,
              "rowType": "Working",
              "ratecardVersionDisplay": "Working",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "3Q2021",
              "pricePeriodStartDate": "2021-06-28T00:00:00",
              "pricePeriodEndDate": "2021-09-26T00:00:00",
              "priceBreakStart": null,
              "priceBreakEnd": null
            },
            {
              "id": "C32209227Actual",
              "eid": 2209227,
              "packageId": 0,
              "quarter": "3Q/2021",
              "sellingRotationId": 46013,
              "rowType": "Actual",
              "ratecardVersionDisplay": "Actual",
              "ratecardVersion": "406",
              "ratecardRevision": "00000",
              "pricePeriodName": "3Q2021",
              "pricePeriodStartDate": "2021-06-28T00:00:00",
              "pricePeriodEndDate": "2021-09-26T00:00:00",
              "priceBreakStart": null,
              "priceBreakEnd": null
            },
            {
              "id": "C32200277Released",
              "eid": 2200277,
              "packageId": 0,
              "quarter": "3Q/2021",
              "sellingRotationId": 46013,
              "rowType": "Released",
              "ratecardVersionDisplay": "394.00011",
              "ratecardVersion": "394",
              "ratecardRevision": "00011",
              "pricePeriodName": "3Q2021",
              "pricePeriodStartDate": "2021-06-28T00:00:00",
              "pricePeriodEndDate": "2021-09-26T00:00:00",
              "priceBreakStart": "2021-06-28T00:00:00",
              "priceBreakEnd": "2021-09-26T00:00:00"
            },
            {
              "id": "C31903366Released",
              "eid": 1903366,
              "packageId": 0,
              "quarter": "3Q/2021",
              "sellingRotationId": 46013,
              "rowType": "Released",
              "ratecardVersionDisplay": "319.00000",
              "ratecardVersion": "319",
              "ratecardRevision": "00000",
              "pricePeriodName": "3Q2021",
              "pricePeriodStartDate": "2021-06-28T00:00:00",
              "pricePeriodEndDate": "2021-09-26T00:00:00",
              "priceBreakStart": "2021-06-28T00:00:00",
              "priceBreakEnd": "2021-09-26T00:00:00"
            },
            {
              "id": "C31892282Released",
              "eid": 1892282,
              "packageId": 0,
              "quarter": "4Q/2021",
              "sellingRotationId": 46013,
              "rowType": "Released",
              "ratecardVersionDisplay": "Current",
              "ratecardVersion": "318",
              "ratecardRevision": "00000",
              "pricePeriodName": "4Q2021",
              "pricePeriodStartDate": "2021-09-27T00:00:00",
              "pricePeriodEndDate": "2021-12-26T00:00:00",
              "priceBreakStart": "2021-09-27T00:00:00",
              "priceBreakEnd": "2021-12-26T00:00:00"
            },
            {
              "id": "C3-1892282Working",
              "eid": -1892282,
              "packageId": 0,
              "quarter": "4Q/2021",
              "sellingRotationId": 46013,
              "rowType": "Working",
              "ratecardVersionDisplay": "Working",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "4Q2021",
              "pricePeriodStartDate": "2021-09-27T00:00:00",
              "pricePeriodEndDate": "2021-12-26T00:00:00",
              "priceBreakStart": null,
              "priceBreakEnd": null
            },
            {
              "id": "C31892282Actual",
              "eid": 1892282,
              "packageId": 0,
              "quarter": "4Q/2021",
              "sellingRotationId": 46013,
              "rowType": "Actual",
              "ratecardVersionDisplay": "Actual",
              "ratecardVersion": "318",
              "ratecardRevision": "00000",
              "pricePeriodName": "4Q2021",
              "pricePeriodStartDate": "2021-09-27T00:00:00",
              "pricePeriodEndDate": "2021-12-26T00:00:00",
              "priceBreakStart": null,
              "priceBreakEnd": null
            },
            {
              "id": "C3519885Released",
              "eid": 519885,
              "packageId": 0,
              "quarter": "4Q/2021",
              "sellingRotationId": 46013,
              "rowType": "Released",
              "ratecardVersionDisplay": "304.00468",
              "ratecardVersion": "304",
              "ratecardRevision": "00468",
              "pricePeriodName": "4Q2021",
              "pricePeriodStartDate": "2021-09-27T00:00:00",
              "pricePeriodEndDate": "2021-12-26T00:00:00",
              "priceBreakStart": "2021-09-27T00:00:00",
              "priceBreakEnd": "2021-12-26T00:00:00"
            },
            {
              "id": "C32247934Released",
              "eid": 2247934,
              "packageId": 0,
              "quarter": "4Q/2021",
              "sellingRotationId": 58706,
              "rowType": "Released",
              "ratecardVersionDisplay": "Current",
              "ratecardVersion": "440",
              "ratecardRevision": "00001",
              "pricePeriodName": "PB1",
              "pricePeriodStartDate": "2021-09-27T00:00:00",
              "pricePeriodEndDate": "2021-10-17T00:00:00",
              "priceBreakStart": "2021-09-27T00:00:00",
              "priceBreakEnd": "2021-10-17T00:00:00"
            },
            {
              "id": "C32245668Released",
              "eid": 2245668,
              "packageId": 0,
              "quarter": "4Q/2021",
              "sellingRotationId": 58706,
              "rowType": "Released",
              "ratecardVersionDisplay": "Current",
              "ratecardVersion": "431",
              "ratecardRevision": "00060",
              "pricePeriodName": "PB2",
              "pricePeriodStartDate": "2021-10-18T00:00:00",
              "pricePeriodEndDate": "2021-11-21T00:00:00",
              "priceBreakStart": "2021-10-18T00:00:00",
              "priceBreakEnd": "2021-11-21T00:00:00"
            },
            {
              "id": "C32245672Released",
              "eid": 2245672,
              "packageId": 0,
              "quarter": "4Q/2021",
              "sellingRotationId": 58706,
              "rowType": "Released",
              "ratecardVersionDisplay": "Current",
              "ratecardVersion": "431",
              "ratecardRevision": "00060",
              "pricePeriodName": "PB4",
              "pricePeriodStartDate": "2021-12-20T00:00:00",
              "pricePeriodEndDate": "2021-12-26T00:00:00",
              "priceBreakStart": "2021-12-20T00:00:00",
              "priceBreakEnd": "2021-12-26T00:00:00"
            },
            {
              "id": "C3-2247934Working",
              "eid": -2247934,
              "packageId": 0,
              "quarter": "4Q/2021",
              "sellingRotationId": 58706,
              "rowType": "Working",
              "ratecardVersionDisplay": "Working",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "PB1",
              "pricePeriodStartDate": "2021-09-27T00:00:00",
              "pricePeriodEndDate": "2021-10-17T00:00:00",
              "priceBreakStart": null,
              "priceBreakEnd": null
            },
            {
              "id": "C3-2245668Working",
              "eid": -2245668,
              "packageId": 0,
              "quarter": "4Q/2021",
              "sellingRotationId": 58706,
              "rowType": "Working",
              "ratecardVersionDisplay": "Working",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "PB2",
              "pricePeriodStartDate": "2021-10-18T00:00:00",
              "pricePeriodEndDate": "2021-11-21T00:00:00",
              "priceBreakStart": null,
              "priceBreakEnd": null
            },
            {
              "id": "C3-2245672Working",
              "eid": -2245672,
              "packageId": 0,
              "quarter": "4Q/2021",
              "sellingRotationId": 58706,
              "rowType": "Working",
              "ratecardVersionDisplay": "Working",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "PB4",
              "pricePeriodStartDate": "2021-12-20T00:00:00",
              "pricePeriodEndDate": "2021-12-26T00:00:00",
              "priceBreakStart": null,
              "priceBreakEnd": null
            },
            {
              "id": "C32245670Working (Draft)",
              "eid": 2245670,
              "packageId": 0,
              "quarter": "4Q/2021",
              "sellingRotationId": 58706,
              "rowType": "Working (Draft)",
              "ratecardVersionDisplay": "Working (Draft)",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "PB3",
              "pricePeriodStartDate": "2021-11-22T00:00:00",
              "pricePeriodEndDate": "2021-12-19T00:00:00",
              "priceBreakStart": "2021-11-22T00:00:00",
              "priceBreakEnd": "2021-12-19T00:00:00"
            },
            {
              "id": "C32245666Released",
              "eid": 2245666,
              "packageId": 0,
              "quarter": "4Q/2021",
              "sellingRotationId": 58706,
              "rowType": "Released",
              "ratecardVersionDisplay": "431.00060",
              "ratecardVersion": "431",
              "ratecardRevision": "00060",
              "pricePeriodName": "PB1",
              "pricePeriodStartDate": "2021-09-27T00:00:00",
              "pricePeriodEndDate": "2021-10-17T00:00:00",
              "priceBreakStart": "2021-09-27T00:00:00",
              "priceBreakEnd": "2021-10-17T00:00:00"
            },
            {
              "id": "C32016654Released",
              "eid": 2016654,
              "packageId": 0,
              "quarter": "1Q/2022",
              "sellingRotationId": 46013,
              "rowType": "Released",
              "ratecardVersionDisplay": "Current",
              "ratecardVersion": "330",
              "ratecardRevision": "00000",
              "pricePeriodName": "1Q2022",
              "pricePeriodStartDate": "2021-12-27T00:00:00",
              "pricePeriodEndDate": "2022-03-27T00:00:00",
              "priceBreakStart": "2021-12-27T00:00:00",
              "priceBreakEnd": "2022-03-27T00:00:00"
            },
            {
              "id": "C32234859Working (Draft)",
              "eid": 2234859,
              "packageId": 0,
              "quarter": "1Q/2022",
              "sellingRotationId": 46013,
              "rowType": "Working (Draft)",
              "ratecardVersionDisplay": "Working (Draft)",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "1Q2022",
              "pricePeriodStartDate": "2021-12-27T00:00:00",
              "pricePeriodEndDate": "2022-03-27T00:00:00",
              "priceBreakStart": "2021-12-27T00:00:00",
              "priceBreakEnd": "2022-03-27T00:00:00"
            },
            {
              "id": "C32245674Working (Draft)",
              "eid": 2245674,
              "packageId": 0,
              "quarter": "1Q/2022",
              "sellingRotationId": 58706,
              "rowType": "Working (Draft)",
              "ratecardVersionDisplay": "Working (Draft)",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "PB1",
              "pricePeriodStartDate": "2021-12-27T00:00:00",
              "pricePeriodEndDate": "2022-01-09T00:00:00",
              "priceBreakStart": "2021-12-27T00:00:00",
              "priceBreakEnd": "2022-01-09T00:00:00"
            },
            {
              "id": "C32245676Working (Draft)",
              "eid": 2245676,
              "packageId": 0,
              "quarter": "1Q/2022",
              "sellingRotationId": 58706,
              "rowType": "Working (Draft)",
              "ratecardVersionDisplay": "Working (Draft)",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "PB2",
              "pricePeriodStartDate": "2022-01-10T00:00:00",
              "pricePeriodEndDate": "2022-01-23T00:00:00",
              "priceBreakStart": "2022-01-10T00:00:00",
              "priceBreakEnd": "2022-01-23T00:00:00"
            },
            {
              "id": "C32245678Working (Draft)",
              "eid": 2245678,
              "packageId": 0,
              "quarter": "1Q/2022",
              "sellingRotationId": 58706,
              "rowType": "Working (Draft)",
              "ratecardVersionDisplay": "Working (Draft)",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "PB3",
              "pricePeriodStartDate": "2022-01-24T00:00:00",
              "pricePeriodEndDate": "2022-02-27T00:00:00",
              "priceBreakStart": "2022-01-24T00:00:00",
              "priceBreakEnd": "2022-02-27T00:00:00"
            },
            {
              "id": "C32245680Working (Draft)",
              "eid": 2245680,
              "packageId": 0,
              "quarter": "1Q/2022",
              "sellingRotationId": 58706,
              "rowType": "Working (Draft)",
              "ratecardVersionDisplay": "Working (Draft)",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "PB4",
              "pricePeriodStartDate": "2022-02-28T00:00:00",
              "pricePeriodEndDate": "2022-03-27T00:00:00",
              "priceBreakStart": "2022-02-28T00:00:00",
              "priceBreakEnd": "2022-03-27T00:00:00"
            },
            {
              "id": "C32245652Package (Working)",
              "eid": 2245652,
              "packageId": 3019,
              "quarter": "4Q/2021",
              "sellingRotationId": 0,
              "rowType": "Package (Working)",
              "ratecardVersionDisplay": "Working",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "PB1",
              "pricePeriodStartDate": "2021-09-27T00:00:00",
              "pricePeriodEndDate": "2021-10-17T00:00:00",
              "priceBreakStart": null,
              "priceBreakEnd": null
            },
            {
              "id": "C32245654Package (Working)",
              "eid": 2245654,
              "packageId": 3019,
              "quarter": "4Q/2021",
              "sellingRotationId": 0,
              "rowType": "Package (Working)",
              "ratecardVersionDisplay": "Working",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "PB2",
              "pricePeriodStartDate": "2021-10-18T00:00:00",
              "pricePeriodEndDate": "2021-11-21T00:00:00",
              "priceBreakStart": null,
              "priceBreakEnd": null
            },
            {
              "id": "C32245656Package (Working)",
              "eid": 2245656,
              "packageId": 3019,
              "quarter": "4Q/2021",
              "sellingRotationId": 0,
              "rowType": "Package (Working)",
              "ratecardVersionDisplay": "Working",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "PB3",
              "pricePeriodStartDate": "2021-11-22T00:00:00",
              "pricePeriodEndDate": "2021-12-19T00:00:00",
              "priceBreakStart": null,
              "priceBreakEnd": null
            },
            {
              "id": "C32245658Package (Working)",
              "eid": 2245658,
              "packageId": 3019,
              "quarter": "4Q/2021",
              "sellingRotationId": 0,
              "rowType": "Package (Working)",
              "ratecardVersionDisplay": "Working",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "PB4",
              "pricePeriodStartDate": "2021-12-20T00:00:00",
              "pricePeriodEndDate": "2021-12-26T00:00:00",
              "priceBreakStart": null,
              "priceBreakEnd": null
            },
            {
              "id": "C32245652Working (Draft)",
              "eid": 2245652,
              "packageId": 3019,
              "quarter": "4Q/2021",
              "sellingRotationId": 58704,
              "rowType": "Working (Draft)",
              "ratecardVersionDisplay": "Working (Draft)",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "PB1",
              "pricePeriodStartDate": "2021-09-27T00:00:00",
              "pricePeriodEndDate": "2021-10-17T00:00:00",
              "priceBreakStart": "2021-09-27T00:00:00",
              "priceBreakEnd": "2021-10-17T00:00:00"
            },
            {
              "id": "C32245654Working (Draft)",
              "eid": 2245654,
              "packageId": 3019,
              "quarter": "4Q/2021",
              "sellingRotationId": 58704,
              "rowType": "Working (Draft)",
              "ratecardVersionDisplay": "Working (Draft)",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "PB2",
              "pricePeriodStartDate": "2021-10-18T00:00:00",
              "pricePeriodEndDate": "2021-11-21T00:00:00",
              "priceBreakStart": "2021-10-18T00:00:00",
              "priceBreakEnd": "2021-11-21T00:00:00"
            },
            {
              "id": "C32245656Working (Draft)",
              "eid": 2245656,
              "packageId": 3019,
              "quarter": "4Q/2021",
              "sellingRotationId": 58704,
              "rowType": "Working (Draft)",
              "ratecardVersionDisplay": "Working (Draft)",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "PB3",
              "pricePeriodStartDate": "2021-11-22T00:00:00",
              "pricePeriodEndDate": "2021-12-19T00:00:00",
              "priceBreakStart": "2021-11-22T00:00:00",
              "priceBreakEnd": "2021-12-19T00:00:00"
            },
            {
              "id": "C32245658Working (Draft)",
              "eid": 2245658,
              "packageId": 3019,
              "quarter": "4Q/2021",
              "sellingRotationId": 58704,
              "rowType": "Working (Draft)",
              "ratecardVersionDisplay": "Working (Draft)",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "PB4",
              "pricePeriodStartDate": "2021-12-20T00:00:00",
              "pricePeriodEndDate": "2021-12-26T00:00:00",
              "priceBreakStart": "2021-12-20T00:00:00",
              "priceBreakEnd": "2021-12-26T00:00:00"
            },
            {
              "id": "C32245684Package (Working)",
              "eid": 2245684,
              "packageId": 3019,
              "quarter": "1Q/2022",
              "sellingRotationId": 0,
              "rowType": "Package (Working)",
              "ratecardVersionDisplay": "Working",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "PB1",
              "pricePeriodStartDate": "2021-12-27T00:00:00",
              "pricePeriodEndDate": "2022-01-09T00:00:00",
              "priceBreakStart": null,
              "priceBreakEnd": null
            },
            {
              "id": "C32245686Package (Working)",
              "eid": 2245686,
              "packageId": 3019,
              "quarter": "1Q/2022",
              "sellingRotationId": 0,
              "rowType": "Package (Working)",
              "ratecardVersionDisplay": "Working",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "PB2",
              "pricePeriodStartDate": "2022-01-10T00:00:00",
              "pricePeriodEndDate": "2022-01-23T00:00:00",
              "priceBreakStart": null,
              "priceBreakEnd": null
            },
            {
              "id": "C32245688Package (Working)",
              "eid": 2245688,
              "packageId": 3019,
              "quarter": "1Q/2022",
              "sellingRotationId": 0,
              "rowType": "Package (Working)",
              "ratecardVersionDisplay": "Working",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "PB3",
              "pricePeriodStartDate": "2022-01-24T00:00:00",
              "pricePeriodEndDate": "2022-02-27T00:00:00",
              "priceBreakStart": null,
              "priceBreakEnd": null
            },
            {
              "id": "C32245690Package (Working)",
              "eid": 2245690,
              "packageId": 3019,
              "quarter": "1Q/2022",
              "sellingRotationId": 0,
              "rowType": "Package (Working)",
              "ratecardVersionDisplay": "Working",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "PB4",
              "pricePeriodStartDate": "2022-02-28T00:00:00",
              "pricePeriodEndDate": "2022-03-27T00:00:00",
              "priceBreakStart": null,
              "priceBreakEnd": null
            },
            {
              "id": "C32245684Working (Draft)",
              "eid": 2245684,
              "packageId": 3019,
              "quarter": "1Q/2022",
              "sellingRotationId": 58704,
              "rowType": "Working (Draft)",
              "ratecardVersionDisplay": "Working (Draft)",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "PB1",
              "pricePeriodStartDate": "2021-12-27T00:00:00",
              "pricePeriodEndDate": "2022-01-09T00:00:00",
              "priceBreakStart": "2021-12-27T00:00:00",
              "priceBreakEnd": "2022-01-09T00:00:00"
            },
            {
              "id": "C32245686Working (Draft)",
              "eid": 2245686,
              "packageId": 3019,
              "quarter": "1Q/2022",
              "sellingRotationId": 58704,
              "rowType": "Working (Draft)",
              "ratecardVersionDisplay": "Working (Draft)",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "PB2",
              "pricePeriodStartDate": "2022-01-10T00:00:00",
              "pricePeriodEndDate": "2022-01-23T00:00:00",
              "priceBreakStart": "2022-01-10T00:00:00",
              "priceBreakEnd": "2022-01-23T00:00:00"
            },
            {
              "id": "C32245688Working (Draft)",
              "eid": 2245688,
              "packageId": 3019,
              "quarter": "1Q/2022",
              "sellingRotationId": 58704,
              "rowType": "Working (Draft)",
              "ratecardVersionDisplay": "Working (Draft)",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "PB3",
              "pricePeriodStartDate": "2022-01-24T00:00:00",
              "pricePeriodEndDate": "2022-02-27T00:00:00",
              "priceBreakStart": "2022-01-24T00:00:00",
              "priceBreakEnd": "2022-02-27T00:00:00"
            },
            {
              "id": "C32245690Working (Draft)",
              "eid": 2245690,
              "packageId": 3019,
              "quarter": "1Q/2022",
              "sellingRotationId": 58704,
              "rowType": "Working (Draft)",
              "ratecardVersionDisplay": "Working (Draft)",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "PB4",
              "pricePeriodStartDate": "2022-02-28T00:00:00",
              "pricePeriodEndDate": "2022-03-27T00:00:00",
              "priceBreakStart": "2022-02-28T00:00:00",
              "priceBreakEnd": "2022-03-27T00:00:00"
            },
            {
              "id": "C32245660Package",
              "eid": 2245660,
              "packageId": 3020,
              "quarter": "4Q/2021",
              "sellingRotationId": 0,
              "rowType": "Package",
              "ratecardVersionDisplay": "Current",
              "ratecardVersion": "431",
              "ratecardRevision": "00061",
              "pricePeriodName": "4Q2021",
              "pricePeriodStartDate": "2021-09-27T00:00:00",
              "pricePeriodEndDate": "2021-12-26T00:00:00",
              "priceBreakStart": null,
              "priceBreakEnd": null
            },
            {
              "id": "C3-2245660Package (Working)",
              "eid": -2245660,
              "packageId": 3020,
              "quarter": "4Q/2021",
              "sellingRotationId": 0,
              "rowType": "Package (Working)",
              "ratecardVersionDisplay": "Working",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "4Q2021",
              "pricePeriodStartDate": "2021-09-27T00:00:00",
              "pricePeriodEndDate": "2021-12-26T00:00:00",
              "priceBreakStart": null,
              "priceBreakEnd": null
            },
            {
              "id": "C32245660Released",
              "eid": 2245660,
              "packageId": 3020,
              "quarter": "4Q/2021",
              "sellingRotationId": 58705,
              "rowType": "Released",
              "ratecardVersionDisplay": "Current",
              "ratecardVersion": "431",
              "ratecardRevision": "00061",
              "pricePeriodName": "4Q2021",
              "pricePeriodStartDate": "2021-09-27T00:00:00",
              "pricePeriodEndDate": "2021-12-26T00:00:00",
              "priceBreakStart": "2021-09-27T00:00:00",
              "priceBreakEnd": "2021-12-26T00:00:00"
            },
            {
              "id": "C3-2245660Working",
              "eid": -2245660,
              "packageId": 3020,
              "quarter": "4Q/2021",
              "sellingRotationId": 58705,
              "rowType": "Working",
              "ratecardVersionDisplay": "Working",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "4Q2021",
              "pricePeriodStartDate": "2021-09-27T00:00:00",
              "pricePeriodEndDate": "2021-12-26T00:00:00",
              "priceBreakStart": null,
              "priceBreakEnd": null
            },
            {
              "id": "C32245662Released",
              "eid": 2245662,
              "packageId": 3020,
              "quarter": "4Q/2021",
              "sellingRotationId": 58707,
              "rowType": "Released",
              "ratecardVersionDisplay": "Current",
              "ratecardVersion": "431",
              "ratecardRevision": "00061",
              "pricePeriodName": "4Q2021",
              "pricePeriodStartDate": "2021-09-27T00:00:00",
              "pricePeriodEndDate": "2021-12-26T00:00:00",
              "priceBreakStart": "2021-09-27T00:00:00",
              "priceBreakEnd": "2021-12-26T00:00:00"
            },
            {
              "id": "C3-2245662Working",
              "eid": -2245662,
              "packageId": 3020,
              "quarter": "4Q/2021",
              "sellingRotationId": 58707,
              "rowType": "Working",
              "ratecardVersionDisplay": "Working",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "4Q2021",
              "pricePeriodStartDate": "2021-09-27T00:00:00",
              "pricePeriodEndDate": "2021-12-26T00:00:00",
              "priceBreakStart": null,
              "priceBreakEnd": null
            },
            {
              "id": "C32245682Package",
              "eid": 2245682,
              "packageId": 3020,
              "quarter": "1Q/2022",
              "sellingRotationId": 0,
              "rowType": "Package",
              "ratecardVersionDisplay": "Current",
              "ratecardVersion": "431",
              "ratecardRevision": "00061",
              "pricePeriodName": "1Q2022",
              "pricePeriodStartDate": "2021-12-27T00:00:00",
              "pricePeriodEndDate": "2022-03-27T00:00:00",
              "priceBreakStart": null,
              "priceBreakEnd": null
            },
            {
              "id": "C3-2245682Package (Working)",
              "eid": -2245682,
              "packageId": 3020,
              "quarter": "1Q/2022",
              "sellingRotationId": 0,
              "rowType": "Package (Working)",
              "ratecardVersionDisplay": "Working",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "1Q2022",
              "pricePeriodStartDate": "2021-12-27T00:00:00",
              "pricePeriodEndDate": "2022-03-27T00:00:00",
              "priceBreakStart": null,
              "priceBreakEnd": null
            },
            {
              "id": "C32245682Released",
              "eid": 2245682,
              "packageId": 3020,
              "quarter": "1Q/2022",
              "sellingRotationId": 58705,
              "rowType": "Released",
              "ratecardVersionDisplay": "Current",
              "ratecardVersion": "431",
              "ratecardRevision": "00061",
              "pricePeriodName": "1Q2022",
              "pricePeriodStartDate": "2021-12-27T00:00:00",
              "pricePeriodEndDate": "2022-03-27T00:00:00",
              "priceBreakStart": "2021-12-27T00:00:00",
              "priceBreakEnd": "2022-03-27T00:00:00"
            },
            {
              "id": "C3-2245682Working",
              "eid": -2245682,
              "packageId": 3020,
              "quarter": "1Q/2022",
              "sellingRotationId": 58705,
              "rowType": "Working",
              "ratecardVersionDisplay": "Working",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "1Q2022",
              "pricePeriodStartDate": "2021-12-27T00:00:00",
              "pricePeriodEndDate": "2022-03-27T00:00:00",
              "priceBreakStart": null,
              "priceBreakEnd": null
            },
            {
              "id": "C32245664Released",
              "eid": 2245664,
              "packageId": 3020,
              "quarter": "1Q/2022",
              "sellingRotationId": 58707,
              "rowType": "Released",
              "ratecardVersionDisplay": "Current",
              "ratecardVersion": "431",
              "ratecardRevision": "00061",
              "pricePeriodName": "1Q2022",
              "pricePeriodStartDate": "2021-12-27T00:00:00",
              "pricePeriodEndDate": "2022-03-27T00:00:00",
              "priceBreakStart": "2021-12-27T00:00:00",
              "priceBreakEnd": "2022-03-27T00:00:00"
            },
            {
              "id": "C3-2245664Working",
              "eid": -2245664,
              "packageId": 3020,
              "quarter": "1Q/2022",
              "sellingRotationId": 58707,
              "rowType": "Working",
              "ratecardVersionDisplay": "Working",
              "ratecardVersion": null,
              "ratecardRevision": null,
              "pricePeriodName": "1Q2022",
              "pricePeriodStartDate": "2021-12-27T00:00:00",
              "pricePeriodEndDate": "2022-03-27T00:00:00",
              "priceBreakStart": null,
              "priceBreakEnd": null
            }
          ];

        var originalRows = Array.from(gridRows);

        // Act
        var result = window.pricingEstimatesGrid.testingOnly.sortGridRows(gridRows);

        // Assert
        expect(gridRows.length).toEqual(originalRows.length); 

        for(let i=0 ; i< result.length-1; i++){
            
            var current= result[i];
            var next= result[i+1];

            //For rows in the same package, to debug and see index use console.log(`Index: ${i}/${result.length}`);
            if(current.packageId === next.packageId){
                //For rows in the same quarter
                if(current.quarter === next.quarter){
                    expect(parseInt(current.quarter)).toBeLessThanOrEqual(parseInt(next.quarter));
                    //Same Selling Rotation
                    if(current.sellingRotationId === next.sellingRotationId){
                        expect(parseInt(current.sellingRotationId)).toBeLessThanOrEqual(parseInt(next.sellingRotationId));

                        //Same Price period
                        if(current.pricePeriodName === next.pricePeriodName){

                            //If we have pricePeriod then compare dates
                            if(current.pricePeriodStartDate && next.pricePeriodStartDate){
                                var currentPricePeriodStartDate= new Date(current.pricePeriodStartDate).getTime();
                                var nextPricePeriodStartDate= new Date(next.pricePeriodStartDate).getTime();    
                                expect(currentPricePeriodStartDate).toBeLessThanOrEqual(nextPricePeriodStartDate);
                            }
                            //If we have rateCardVersion compare versions
                            if(current.ratecardVersion != null && next.ratecardVersion != null){
                                expect(parseFloat(current.ratecardVersion)).toBeGreaterThanOrEqual(parseFloat(next.ratecardVersion));
                            }//if we don't have rateCardVersions we need to compare ordinals
                            else if(current.ratecardVersion === null || next.ratecardVersion === null){
                                expect(current.ordinal).toBeLessThanOrEqual(next.ordinal);
                            }
                        }//If next row is not in the same pricePeriod and has pricePeriod, we just compare pricePeriods dates
                        else if(current.pricePeriodStartDate && next.pricePeriodStartDate){
                            var currentPricePeriodStartDate= new Date(current.pricePeriodStartDate).getTime();
                            var nextPricePeriodStartDate= new Date(next.pricePeriodStartDate).getTime();    
                            expect(currentPricePeriodStartDate).toBeLessThanOrEqual(nextPricePeriodStartDate);
                        }
                    }
                }else{
                    //comparing quarter order
                    var currentYear= parseInt(current.quarter.substr(3));
                    var nextYear= parseInt(next.quarter.substr(3));
                    expect(currentYear).toBeLessThanOrEqual(nextYear); //year
                    if(currentYear === nextYear){
                        expect(parseInt(current.quarter.charAt(0))).toBeLessThanOrEqual(parseInt(next.quarter.charAt(0))); //quarterNumer same year
                    }else{
                        expect(parseInt(current.quarter.charAt(0))).toBeGreaterThanOrEqual(parseInt(next.quarter.charAt(0))); //quarterNumer diferent year
                    }                    
                }   
            }else{
                //comparing package order
                expect(current.packageId).toBeLessThanOrEqual(next.packageId);    
            }
            
        }
    });
});