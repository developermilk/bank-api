const { CookieJar, Cookie } = require("tough-cookie");
const CookieFileStore = require("tough-cookie-file-store").FileCookieStore;
const request = require("request");
const cheerio = require("cheerio");
const fs = require("fs");
require("dotenv").config();

class KrungsriBizOnlineModel {
  constructor(username, password) {
    this.username = username;
    this.password = password;
    this.cookieJar = new CookieJar(
      new CookieFileStore(`./cookies/${username}.json`)
    );
    this.URL_LOGIN = process.env.URL_LOGIN;
    this.MY_PORTFOLIO_URL = process.env.MY_PORTFOLIO_URL;
    this.BASEURL = process.env.BASEURL;
    this.DEPOSIT_URL = process.env.DEPOSIT_URL;
    this.GET_STATEMENT_HISTORY_URL = process.env.GET_STATEMENT_HISTORY_URL;
    this.SMS_URL = process.env.SMS_URL;
    this.tokenMyAccoun = null;
    this.tokenTransfer = null;
    this.cookies = null;
  }

  async login() {
    try {
      const check_login = await this.MyPortfolio();
      if (check_login.status == 200) {
        return check_login;
      } else {
        await this.cookieJar.removeAllCookies();
        const loginPageResponse = await this.getRequest(this.URL_LOGIN);
        const $ = cheerio.load(loginPageResponse.body);
        const formData = {
          __EVENTARGUMENT: "",
          __EVENTTARGET: "ctl00$cphLoginBox$imgLogin",
          __EVENTVALIDATION: $("#__EVENTVALIDATION").val(),
          __LASTFOCUS: "",
          __PREVIOUSPAGE: $("#__PREVIOUSPAGE").val(),
          __VIEWSTATE: $("#__VIEWSTATE").val(),
          __VIEWSTATEENCRYPTED: "",
          __VIEWSTATEGENERATOR: $("#__VIEWSTATEGENERATOR").val(),
          ctl00$cphLoginBox$hdLogin: "",
          ctl00$cphLoginBox$hdPassword: this.password,
          ctl00$cphLoginBox$hddLanguage: "TH",
          ctl00$cphLoginBox$hddPWD: "",
          ctl00$cphLoginBox$txtPasswordSME: "",
          ctl00$cphLoginBox$txtUsernameSME: this.username,
          ctl00$hddApplicationMode: "KBOL",
          password: "",
          username: "",
        };
        const loginResponse = await this.postRequest(this.URL_LOGIN, formData, {
          "Content-Type": "application/x-www-form-urlencoded",
        });
        const $loginResponse = cheerio.load(loginResponse.body);
        const loginResponsetitle = $loginResponse("title").text();
        if (loginResponsetitle === "Moved Temporarily") {
          const setCookies = loginResponse.headers["set-cookie"];
          await this.cookieJar.setCookie(setCookies.join(";"), this.BASEURL);
          return await this.MyPortfolio();
        } else {
          return {
            status: 404,
            msg: "error",
            errorType: "LoginError",
            errorMessage: "Invalid credentials",
          };
        }
      }
    } catch (error) {
      console.error("Error occurred during login:", error);
      await this.cookieJar.removeAllCookies();
      return await this.login();
    }
  }

  async MyPortfolio() {
    const getMyPortfolioPage = await this.getRequest(this.MY_PORTFOLIO_URL);
    const $ = cheerio.load(getMyPortfolioPage.body);
    const title = $("title").text().trim();
    if (title == "Krungsri Biz Online") {
      $('a[href^="/BAY.KOL.Corp.WebSite"]').each((index, element) => {
        const href = $(element).attr("href");

        if (href.includes("/BAY.KOL.Corp.WebSite/Pages/MyAccount.aspx")) {
          this.tokenMyAccount = `${this.BASEURL}${href}`;
        } else if (
          href.includes(
            "/BAY.KOL.Corp.WebSite/Pages/FundTransfer/OtherTransfer.aspx"
          )
        ) {
          this.tokenTransfer = `${this.BASEURL}${href}`;
        }
      });
      const fullName = $(".content_left_topbar_title.kbol_title div")
        .text()
        .trim()
        .split("\n");
      const firstName = fullName[0].trim();
      const lastName = fullName[1].trim();
      const balance = $(".amc").first().text().trim();
      const lastLogin = $("#ctl00_lblShowLastLogin").text().trim();
      const account_number = (getMyPortfolioPage.body.match(/accNo="(\d+)"/) ||
        [])[1];
      return {
        status: 200,
        msg: "success",
        data: {
          username: this.username,
          account_number: account_number,
          balance: balance,
          last_login: lastLogin,
          first_name: firstName,
          last_name: lastName,
        },
      };
    } else {
        //await this.cookieJar.removeAllCookies();
      return {
        status: 404,
        msg: "error",
        errorType: "LoginError",
        errorMessage: "Invalid credentials",
      };
    }
  }

  async transfer(AccTo, bankcode, amount) {
    const transfer_get = await this.getRequest(this.tokenTransfer);
    const $ = cheerio.load(transfer_get.body);
    const title = $("title").text();
    if (title.includes("Krungsri Biz Online")) {
      const __VIEWSTATE = $('input[name="__VIEWSTATE"]').attr("value");
      const __VIEWSTATEGENERATOR = $('input[name="__VIEWSTATEGENERATOR"]').attr("value");
      const __PREVIOUSPAGE = $('input[name="__PREVIOUSPAGE"]').attr("value");
      const __EVENTVALIDATION = $('input[name="__EVENTVALIDATION"]').attr("value");
      const ctl00$cphSectionButton$hfFromAccNo = $('input[name="ctl00$cphSectionButton$hfFromAccNo"]').attr("value");
      const payload = {
        ctl00$smMain: "ctl00$smMain|ctl00$cphSectionData$btnSubmit",
        __EVENTTARGET: "",
        __EVENTARGUMENT: "",
        __LASTFOCUS: "",
        __VIEWSTATE: __VIEWSTATE,
        __VIEWSTATEGENERATOR: __VIEWSTATEGENERATOR,
        __VIEWSTATEENCRYPTED: "",
        __PREVIOUSPAGE: __PREVIOUSPAGE,
        __EVENTVALIDATION: __EVENTVALIDATION,
        ctl00$hddNoAcc: "",
        ctl00$hddMainAccIsCreditCard: "",
        ctl00$bannerTop$hdTransactionType: "",
        ctl00$bannerTop$hdCampaignCode: "",
        ctl00$bannerTop$hdCampaignTxnType: "",
        ctl00$bannerTop$hdCampaignMutualFundType: "",
        ctl00$bannerTop$hdCampaignTransferType: "",
        ctl00$bannerTop$hdAccNo: "",
        ctl00$bannerTop$hdBillerId: "",
        ctl00$bannerTop$hdUrlRedirect: "",
        ctl00$bannerTop$hdAmount: "",
        ctl00$bannerTop$hdTxnIsSuccess: "",
        ctl00$bannerTop$hdBillerCategory: "",
        ctl00$bannerTop$hdBillerName: "",
        ctl00$bannerTop$hdAJAXData: "",
        ctl00$hddIsLoadComplete: false,
        ctl00$hdnCurrentPageQuickMenu: "",
        ctl00$hdnPageIndexQuickMenuLoaded: "",
        ctl00$cphSectionData$ddlBanking: bankcode,
        ctl00$cphSectionData$txtAccTo: AccTo,
        ctl00$cphSectionData$txtAccToP2P: "",
        ctl00$cphSectionData$txtAmountTransfer: amount,
        ctl00$cphSectionData$ddlFixedType: "",
        ctl00$cphSectionData$txtOtherReason: "",
        ctl00$cphSectionData$scheduleType: "now",
        ctl00$cphSectionData$txtPaymentDate_Once: "",
        ctl00$cphSectionData$ddlRecurring: "",
        ctl00$cphSectionData$txtRecurringDateStart: "",
        ctl00$cphSectionData$txtRecurringDateEnd: "",
        ctl00$cphSectionData$alertType: "yes",
        ctl00$cphSectionData$notify_receiver: "0",
        ctl00$cphSectionData$txtEmailNotifyTo: "",
        ctl00$cphSectionData$txtEmailNotifyToName: "",
        ctl00$cphSectionData$txtEmailNotifyToRemark: "",
        ctl00$cphSectionData$txtSMSNotifyToMobileNo: "",
        ctl00$cphSectionData$txtSMSNotifyToName: "",
        ctl00$cphSectionData$txtMemo: "",
        ctl00$cphSectionData$hdScheduleId: "",
        ctl00$cphSectionData$hdScheduleUI: "0",
        ctl00$cphSectionData$hdTransactionCode: "",
        ctl00$cphSectionButton$hfDefault:
          "ctl00_cphSectionData_rptAccFrom_ctl00_pnlFromAcc",
        ctl00$cphSectionButton$hfToDefault:
          "ctl00_cphSectionData_pnlToNewAcc_cate",
        ctl00$cphSectionButton$hfMainAccount:
          "ctl00_cphSectionData_rptAccFrom_ctl00_pnlFromAcc",
        ctl00$cphSectionButton$hfToAccount:
          "ctl00_cphSectionData_pnlToNewAcc_cate",
        ctl00$cphSectionButton$hfFromAccNo: ctl00$cphSectionButton$hfFromAccNo,
        ctl00$cphSectionButton$hfToAccNo: AccTo,
        ctl00$cphSectionButton$hfToCode: bankcode,
        ctl00$cphSectionButton$hfEmail: "0",
        ctl00$cphSectionButton$hfSMS: "0",
        ctl00$cphSectionButton$hfOthereasonID: "",
        ctl00$cphSectionButton$hfCannotAccess: "",
        ctl00$cphSectionButton$hfP2P: "",
        ctl00$cphSectionButton$hdnLanguageUsed: "TH",
        ctl00$hddHasSess: "",
        __ASYNCPOST: true,
        ctl00$cphSectionData$btnSubmit: "ดำเนินการ",
      };
      const transfer_post = await this.postRequest(
        this.tokenTransfer,
        payload,
        { "Content-Type": "application/x-www-form-urlencoded" }
      );
      const $3 = cheerio.load(transfer_post.body);
      const errorMessage = $3('#ctl00_cphSectionData_vsMessage').text().trim();
      if (errorMessage) {
        return {
          status: 404,
          msg: "error",
          errorType: "TransferError",
          errorMessage: errorMessage,
        };
      }

      const confirm_url =`${this.BASEURL}/${decodeURIComponent(transfer_post.body.match(/(?<=%2f).*?(?=\|)/)[0])}`
      const confirmtransfer_get = await this.getRequest(confirm_url);
      const $2 = cheerio.load(confirmtransfer_get.body);
      const ref = $2('div.input_input_half').text().trim().match(/\d+/)[0];
      let __VIEWSTATE2 = $2('input[name="__VIEWSTATE"]').attr("value");
      let __VIEWSTATEGENERATOR2 = $2('input[name="__VIEWSTATEGENERATOR"]').attr("value");
      let __PREVIOUSPAGE2 = $2('input[name="__PREVIOUSPAGE"]').attr("value");
      let __EVENTVALIDATION2 = $2('input[name="__EVENTVALIDATION"]').attr("value");

      console.log("ref: ",ref);
      const sms = await this.getSmsOtp(ref);
    if (sms.status == 200) {
        
      const payload_confirm = {
        ctl00$smMain:"ctl00$cphSectionData$OTPBox1$udpOTPBox|ctl00$cphSectionData$OTPBox1$btnConfirm",
        __EVENTTARGET: "ctl00$cphSectionData$OTPBox1$btnConfirm",
        __EVENTARGUMENT: "",
        __VIEWSTATE: __VIEWSTATE2,
        __VIEWSTATEGENERATOR: __VIEWSTATEGENERATOR2,
        __VIEWSTATEENCRYPTED: "",
        __PREVIOUSPAGE: __PREVIOUSPAGE2,
        __EVENTVALIDATION: __EVENTVALIDATION2,
        ctl00$hddNoAcc: "",
        ctl00$hddMainAccIsCreditCard: "",
        ctl00$bannerTop$hdTransactionType: "",
        ctl00$bannerTop$hdCampaignCode: "",
        ctl00$bannerTop$hdCampaignTxnType: "",
        ctl00$bannerTop$hdCampaignMutualFundType: "",
        ctl00$bannerTop$hdCampaignTransferType: "",
        ctl00$bannerTop$hdAccNo: "",
        ctl00$bannerTop$hdBillerId: "",
        ctl00$bannerTop$hdUrlRedirect: "",
        ctl00$bannerTop$hdAmount: "",
        ctl00$bannerTop$hdTxnIsSuccess: "",
        ctl00$bannerTop$hdBillerCategory: "",
        ctl00$bannerTop$hdBillerName: "",
        ctl00$bannerTop$hdAJAXData: "",
        ctl00$hddIsLoadComplete: false,
        ctl00$hdnCurrentPageQuickMenu: "",
        ctl00$hdnPageIndexQuickMenuLoaded: "",
        ctl00$cphSectionData$OTPBox1$Password2: "",
        ctl00$cphSectionData$OTPBox1$txtTemp: "",
        ctl00$cphSectionData$OTPBox1$hddOTPPassword: sms.data.otp,
        ctl00$cphSectionData$OTPBox1$txtOTPPassword: "",
        ctl00$hddHasSess: "",
        __ASYNCPOST: true,
      };
      const confirmtransfer_post = await this.postRequest(
        confirm_url,
        payload_confirm,
        { "Content-Type": "application/x-www-form-urlencoded" }
      );
      const CompletedTransfer = await this.getRequest(
        `${this.BASEURL}${decodeURIComponent(
            confirmtransfer_post.body.match(/%2f[^|]+(?=\|)/)?.[0] || ""
        )}`
      );
      const $ = cheerio.load(CompletedTransfer.body);
      // Find the elements you're interested in and extract the information
      const transferAmount = $('#ctl00_cphSectionData_pnlTranAmount_Local .transaction_detail_row_value').text().trim();
      const transferFee = $('#ctl00_cphSectionData_pnlTranFee_Local .transaction_detail_row_value').text().trim();
      const transactionRefNo = $('#ctl00_cphSectionData_pnlTranRefNo_Local .transaction_detail_row_value').text().trim();
      const transactionDateTime = $('#ctl00_cphSectionData_pnlTranDate_Local .transaction_detail_row_value').text().trim();
      

      // Output the extracted information
      console.log("=======================================================")
      console.log('Transfer Amount:', transferAmount);
      console.log('Transfer Fee:', transferFee);
      console.log('Transaction Reference Number:', transactionRefNo);
      console.log('Transaction Date/Time:', transactionDateTime);
      console.log("=======================================================")
      return {
        status: 200,
        msg: "success",
        data: {
            transferAmount: transferAmount,
            transferFee: transferFee,
            transactionRefNo: transactionRefNo,
            transactionDateTime: transactionDateTime
        }
    };
    
    }else{
        return sms
    }

     }
  }

  async getSmsOtp(ref) {
    const startTime = Date.now();
    let statusOtp = null;

    while (true) {
        try {
            const response = await new Promise((resolve, reject) => {
                request.get(`${this.SMS_URL}?ref=${ref}`, (error, response, body) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(response);
                    }
                });
            });

            const sms = JSON.parse(response.body);
            console.log("Wait",sms);

            if (sms && sms.otp) {
                statusOtp = sms.otp;
                break;
            }
        } catch (error) {
            console.error('Error fetching SMS:', error.message);
        }

        if (Date.now() - startTime >= 30000) { // 30 seconds timeout
            console.log('Timeout: OTP not received within 30 seconds');
            return {
              status: 408,
              msg: "error",
              errorType: "TimeoutError",
              errorMessage: "OTP not received within 30 seconds",
            };
          
        }

        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
        }
        await new Promise((resolve, reject) => {
        request.get(`${this.SMS_URL}?ref=${ref}&delete=true`, (error, response, body) => {
            if (error) {
                reject(error);
            } else {
                resolve(response);
            }
        });
    });

    
    return {
      status: 200,
      msg: "success",
      data:{
        otp:statusOtp
      }
    };

}

  async getStatement(start_date = null, end_date = null, next = null) {
    try {
      // Get current date
      const currentDate = new Date();
      const day = currentDate.getDate().toString().padStart(2, "0");
      const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
      const year = currentDate.getFullYear();

      // Set default start_date and end_date if not provided
      if (start_date === null) {
        start_date = `${year}-${month}-${day}`;
      }
      if (end_date === null) {
        end_date = `${year}-${month}-${day}`;
      }

      // Fetch statement inquiry page to get necessary data
      const statementInquiry_GET = await this.getRequest(this.DEPOSIT_URL);
      const $ = cheerio.load(statementInquiry_GET.body);
      const title = $("title").text().trim();
        // Extract required values from the page
        const __VIEWSTATE = $("#__VIEWSTATE").val();
        const __VIEWSTATEGENERATOR = $("#__VIEWSTATEGENERATOR").val();
        const __PREVIOUSPAGE = $("#__PREVIOUSPAGE").val();
        const __EVENTVALIDATION = $("#__EVENTVALIDATION").val();
        const ctl00$cphSectionData$ddlAccount = $(
          "#ctl00_cphSectionData_ddlAccount"
        ).val();

        // Prepare payload for POST request
        const payload = {
          ctl00$smMain:
            "ctl00$cphSectionData$udpButton|ctl00$cphSectionData$btnInquiry",
          __EVENTTARGET: "",
          __EVENTARGUMENT: "",
          __VIEWSTATE: __VIEWSTATE,
          __VIEWSTATEGENERATOR: __VIEWSTATEGENERATOR,
          __VIEWSTATEENCRYPTED: "",
          __PREVIOUSPAGE: __PREVIOUSPAGE,
          __EVENTVALIDATION: __EVENTVALIDATION,
          ctl00$hddNoAcc: "",
          ctl00$hddMainAccIsCreditCard: "",
          ctl00$bannerTop$hdTransactionType: "",
          ctl00$bannerTop$hdCampaignCode: "",
          ctl00$bannerTop$hdCampaignTxnType: "",
          ctl00$bannerTop$hdCampaignMutualFundType: "",
          ctl00$bannerTop$hdCampaignTransferType: "",
          ctl00$bannerTop$hdAccNo: "",
          ctl00$bannerTop$hdBillerId: "",
          ctl00$bannerTop$hdUrlRedirect: "",
          ctl00$bannerTop$hdAmount: "",
          ctl00$bannerTop$hdTxnIsSuccess: "",
          ctl00$bannerTop$hdBillerCategory: "",
          ctl00$bannerTop$hdBillerName: "",
          ctl00$bannerTop$hdAJAXData: "",
          ctl00$hddIsLoadComplete: "false",
          ctl00$hdnCurrentPageQuickMenu: "",
          ctl00$hdnPageIndexQuickMenuLoaded: "",
          ctl00$cphSectionData$ddlAccount: ctl00$cphSectionData$ddlAccount,
          ctl00$cphSectionData$dpStart: `${day}/${month}/${year}`,
          ctl00$cphSectionData$dpEnd: `${day}/${month}/${year}`,
          ctl00$hddHasSess: "",
          __ASYNCPOST: "true",
          ctl00$cphSectionData$btnInquiry: "แสดงรายการ",
        };

        // Send POST request to get statement history
        const statementInquiry_POST = await this.postRequest(
          this.DEPOSIT_URL,
          payload,
          { "Content-Type": "application/x-www-form-urlencoded" }
        );
        // Decode the URL from the response
        await this.getRequest(
          `${this.BASEURL}${decodeURIComponent(
            statementInquiry_POST.body.match(/%2f[^|]+(?=\|)/)?.[0] || ""
          )}`
        );
        // Fetch statement history
        const statementHistoryResponse = await this.postRequest(
          this.GET_STATEMENT_HISTORY_URL,
          {
            pageIndex: 1,
            pageoffset: next,
            language: "TH",
            jsonparam: JSON.stringify({
              AccNo: null,
              AccType: 1,
              FromRequest: `${start_date}T00:00:00`,
              ToRequest: `${end_date}T00:00:00`,
              CustId: null,
              PagingOffset: null,
              PageSize: 0,
              SortBy: null,
            }),
          },
          { "Content-Type": "application/json; charset=UTF-8" }
        );
        // Parse and return the statement history data
        return {
          status: 200,
          msg: "success",
          data: JSON.parse(statementHistoryResponse.body.d),
        };
      
    } catch (error) {
        //await this.cookieJar.removeAllCookies();
      return this.getStatement(start_date, end_date , next );
    }
  }

    getBankList(){
    return   [
        {
            bankCode: '030', // ออมสิน GSB
            shortCode: 'GSB',
            bankNameEn: 'Government Savings Bank',
            bankNameTh: 'ธนาคารออมสิน',
        },
        {
            bankCode: '002', // กรุงเทพ BBL
            shortCode: 'BBL',
            bankNameEn: 'Bangkok Bank',
            bankNameTh: 'ธนาคารกรุงเทพ',
           
        },
        {
            bankCode: '004', // กสิกร KBANK
            shortCode: 'KBANK',
            bankNameEn: 'Kasikorn Bank',
            bankNameTh: 'ธนาคารกสิกรไทย',
         
        },
        {
            bankCode: '006', // กรุงไทย KTB
            shortCode: 'KTB',
            bankNameEn: 'Krung Thai Bank',
            bankNameTh: 'ธนาคารกรุงไทย',
           
        },
        {
            bankCode: '011', // ทหารไทยธนชาต TTB
            shortCode: 'TTB',
            bankNameEn: 'TMBThanachart Bank',
            bankNameTh: 'ธนาคารทหารไทยธนชาต',
          
        },
        {
            bankCode: '014', // ไทยพาณิชย์ SCB
            shortCode: 'SCB',
            bankNameEn: 'Siam Commercial Bank',
            bankNameTh: 'ธนาคารไทยพาณิชย์',
          
        },
        {
            bankCode: '020', // แสตนดาร์ดชาร์เตอร์ SCBT 
            shortCode: 'SCBT',
            bankNameEn: 'Standard Chartered Bank (Thai)',
            bankNameTh: 'ธนาคารแสตนดาร์ดชาร์เตอร์ (ไทย)',
         
        },
        {
            bankCode: '022', // ซีไอเอ็มบี CIMB
            shortCode: 'CIMB',
            bankNameEn: 'CIMB Thai Bank',
            bankNameTh: 'ธนาคารซีไอเอ็มบีไทย',
           
        },
        {
            bankCode: '024', // ยูโอบี UOB
            shortCode: 'UOB',
            bankNameEn: 'United Overseas Bank (Thai)',
            bankNameTh: 'ธนาคารยูโอบี',
            
        },
        {
            bankCode: '025', // กรุงศรีฯ BAY
            shortCode: 'BAY',
            bankNameEn: 'Bank of Ayudhya',
            bankNameTh: 'ธนาคารกรุงศรีอยุธยา',
            
        },
        {
            bankCode: '073', // แลนด์แอนด์เฮาส์ LHB
            shortCode: 'LHB',
            bankNameEn: 'Land and Houses Bank',
            bankNameTh: 'ธนาคารแลนด์แอนด์เฮาส์',

        },
        {
            bankCode: '069', // ธนาคารเกียรตินาคินภัทร KKP
            shortCode: 'KKP',
            bankNameEn: 'Kiatnakin Phatra Bank',
            bankNameTh: 'ธนาคารเกียรตินาคินภัทร',
            
        },
        {
            bankCode: '017', // ซิตี้ธนาคาร Citi
            shortCode: 'CITI',
            bankNameEn: 'Citibank',
            bankNameTh: 'ธนาคารซิตี้แบงก์',
           
        },
        {
            bankCode: '067', // ทิสโก้ TISCO
            shortCode: 'TISCO',
            bankNameEn: 'Tisco Bank',
            bankNameTh: 'ธนาคารทิสโก้',
           
        },
        {
            bankCode: '034', // ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร BAAC
            shortCode: 'BAAC',
            bankNameEn: 'BAAC',
            bankNameTh: 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร',
           
        },
        {
            bankCode: '066', // ธนาคารอิสลามแห่งประเทศไทย ISBT
            shortCode: 'ISBT',
            bankNameEn: 'Islamic Bank of Thailand',
            bankNameTh: 'ธนาคารอิสลามแห่งประเทศไทย',
           
        },
        {
            bankCode: '018', // ซูมิโตโม มิตซุย แบงกิ้ง คอร์ปอเรชั่น SMBC
            shortCode: 'SMBC',
            bankNameEn: 'Sumitomo Mitsui Banking Corporation (SMBC)',
            bankNameTh: 'ธนาคารซูมิโตโม มิตซุย แบงกิ้ง คอร์ปอเรชั่น ',
           
        },
        {
            bankCode: '031', // ฮ่องกงและเซี่ยงไฮ้ HSBC
            shortCode: 'HSBC',
            bankNameEn: 'Hong Kong & Shanghai Corporation Limited (HSBC)',
            bankNameTh: 'ธนาคารฮ่องกงและเซี่ยงไฮ้ จำกัด  ',
           
        },
        {
            bankCode: '033', // อาคารสงเคราะห์ GHB
            shortCode: 'GHB',
            bankNameEn: 'Government Housing Bank (GHB)',
            bankNameTh: 'ธนาคารอาคารสงเคราะห์ ',
         
        },
        {
            bankCode: '039', // มิซูโฮ MHCB
            shortCode: 'MHCB',
            bankNameEn: 'Mizuho Corporate Bank Limited (MHCB)',
            bankNameTh: 'ธนาคารมิซูโฮ คอร์เปอเรท สาขากรุงเทพฯ',
          
        },
        {
            bankCode: '070', // ไอซีบีซี ICBC
            shortCode: 'ICBC',
            bankNameEn: 'Industrial and Commercial Bank of China (thai) Public Company Limited',
            bankNameTh: 'ธนาคารไอซีบีซี (ไทย) จำกัด (มหาชน)',
         
        },
        {
            bankCode: '071', // ไทยเครดิตเพื่อรายย่อย TCRB
            shortCode: 'TCRB',
            bankNameEn: 'The Thai Credit Retail Bank Public Company Limited (TCRB)',
            bankNameTh: 'ธนาคารไทยเครดิตเพื่อรายย่อย จำกัด (มหาชน)',
         
        },
        {
            bankCode: '032', // ดอยซ์แบงก์ เอจี DBAG
            shortCode: 'DBAG',
            bankNameEn: 'DEUTSCHE BANK AG',
            bankNameTh: 'ธนาคารดอยซ์แบงก์ เอจี',
         
        },
        {
            bankCode: '052', // ธนาคารแห่งประเทศจีน (ไทย) BOC
            shortCode: 'BOC',
            bankNameEn: 'Bank of China (Thai) Public Company Limited (BOC)',
            bankNameTh: 'ธนาคารแห่งประเทศจีน (ไทย) จำกัด (มหาชน)',
           
        },
        {
            bankCode: '079', // เอเอ็นแซด ANZ
            shortCode: 'ANZ',
            bankNameEn: 'ANZ Bank (Thai) Public Company Limited',
            bankNameTh: 'ธนาคารเอเอ็นแซด (ไทย) จำกัด (มหาชน)',
         
        },
        {
            bankCode: '029', // อินเดียนโอเวอร์ซีร์ IOBA
            shortCode: 'IOBA',
            bankNameEn: 'INDIAN OVERSEAS BANK',
            bankNameTh: 'ธนาคารอินเดียนโอเวอร์ซีร์',
           
        },
        {
            bankCode: '045', // บีเอ็นพี พารีบาส์ BNP
            shortCode: 'BNP',
            bankNameEn: 'BNP Paribas Bank',
            bankNameTh: 'ธนาคารบีเอ็นพี พารีบาส์',
        }
    ]
    }
    getBankCode(shortCode) {

    const bankList = [
        {
            bankCode: '030', // ออมสิน GSB
            shortCode: 'GSB',
            bankNameEn: 'Government Savings Bank',
            bankNameTh: 'ธนาคารออมสิน',
        },
        {
            bankCode: '002', // กรุงเทพ BBL
            shortCode: 'BBL',
            bankNameEn: 'Bangkok Bank',
            bankNameTh: 'ธนาคารกรุงเทพ',
           
        },
        {
            bankCode: '004', // กสิกร KBANK
            shortCode: 'KBANK',
            bankNameEn: 'Kasikorn Bank',
            bankNameTh: 'ธนาคารกสิกรไทย',
         
        },
        {
            bankCode: '006', // กรุงไทย KTB
            shortCode: 'KTB',
            bankNameEn: 'Krung Thai Bank',
            bankNameTh: 'ธนาคารกรุงไทย',
           
        },
        {
            bankCode: '011', // ทหารไทยธนชาต TTB
            shortCode: 'TTB',
            bankNameEn: 'TMBThanachart Bank',
            bankNameTh: 'ธนาคารทหารไทยธนชาต',
          
        },
        {
            bankCode: '014', // ไทยพาณิชย์ SCB
            shortCode: 'SCB',
            bankNameEn: 'Siam Commercial Bank',
            bankNameTh: 'ธนาคารไทยพาณิชย์',
          
        },
        {
            bankCode: '020', // แสตนดาร์ดชาร์เตอร์ SCBT 
            shortCode: 'SCBT',
            bankNameEn: 'Standard Chartered Bank (Thai)',
            bankNameTh: 'ธนาคารแสตนดาร์ดชาร์เตอร์ (ไทย)',
         
        },
        {
            bankCode: '022', // ซีไอเอ็มบี CIMB
            shortCode: 'CIMB',
            bankNameEn: 'CIMB Thai Bank',
            bankNameTh: 'ธนาคารซีไอเอ็มบีไทย',
           
        },
        {
            bankCode: '024', // ยูโอบี UOB
            shortCode: 'UOB',
            bankNameEn: 'United Overseas Bank (Thai)',
            bankNameTh: 'ธนาคารยูโอบี',
            
        },
        {
            bankCode: '025', // กรุงศรีฯ BAY
            shortCode: 'BAY',
            bankNameEn: 'Bank of Ayudhya',
            bankNameTh: 'ธนาคารกรุงศรีอยุธยา',
            
        },
        {
            bankCode: '073', // แลนด์แอนด์เฮาส์ LHB
            shortCode: 'LHB',
            bankNameEn: 'Land and Houses Bank',
            bankNameTh: 'ธนาคารแลนด์แอนด์เฮาส์',

        },
        {
            bankCode: '069', // ธนาคารเกียรตินาคินภัทร KKP
            shortCode: 'KKP',
            bankNameEn: 'Kiatnakin Phatra Bank',
            bankNameTh: 'ธนาคารเกียรตินาคินภัทร',
            
        },
        {
            bankCode: '017', // ซิตี้ธนาคาร Citi
            shortCode: 'CITI',
            bankNameEn: 'Citibank',
            bankNameTh: 'ธนาคารซิตี้แบงก์',
           
        },
        {
            bankCode: '067', // ทิสโก้ TISCO
            shortCode: 'TISCO',
            bankNameEn: 'Tisco Bank',
            bankNameTh: 'ธนาคารทิสโก้',
           
        },
        {
            bankCode: '034', // ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร BAAC
            shortCode: 'BAAC',
            bankNameEn: 'BAAC',
            bankNameTh: 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร',
           
        },
        {
            bankCode: '066', // ธนาคารอิสลามแห่งประเทศไทย ISBT
            shortCode: 'ISBT',
            bankNameEn: 'Islamic Bank of Thailand',
            bankNameTh: 'ธนาคารอิสลามแห่งประเทศไทย',
           
        },
        {
            bankCode: '018', // ซูมิโตโม มิตซุย แบงกิ้ง คอร์ปอเรชั่น SMBC
            shortCode: 'SMBC',
            bankNameEn: 'Sumitomo Mitsui Banking Corporation (SMBC)',
            bankNameTh: 'ธนาคารซูมิโตโม มิตซุย แบงกิ้ง คอร์ปอเรชั่น ',
           
        },
        {
            bankCode: '031', // ฮ่องกงและเซี่ยงไฮ้ HSBC
            shortCode: 'HSBC',
            bankNameEn: 'Hong Kong & Shanghai Corporation Limited (HSBC)',
            bankNameTh: 'ธนาคารฮ่องกงและเซี่ยงไฮ้ จำกัด  ',
           
        },
        {
            bankCode: '033', // อาคารสงเคราะห์ GHB
            shortCode: 'GHB',
            bankNameEn: 'Government Housing Bank (GHB)',
            bankNameTh: 'ธนาคารอาคารสงเคราะห์ ',
         
        },
        {
            bankCode: '039', // มิซูโฮ MHCB
            shortCode: 'MHCB',
            bankNameEn: 'Mizuho Corporate Bank Limited (MHCB)',
            bankNameTh: 'ธนาคารมิซูโฮ คอร์เปอเรท สาขากรุงเทพฯ',
          
        },
        {
            bankCode: '070', // ไอซีบีซี ICBC
            shortCode: 'ICBC',
            bankNameEn: 'Industrial and Commercial Bank of China (thai) Public Company Limited',
            bankNameTh: 'ธนาคารไอซีบีซี (ไทย) จำกัด (มหาชน)',
         
        },
        {
            bankCode: '071', // ไทยเครดิตเพื่อรายย่อย TCRB
            shortCode: 'TCRB',
            bankNameEn: 'The Thai Credit Retail Bank Public Company Limited (TCRB)',
            bankNameTh: 'ธนาคารไทยเครดิตเพื่อรายย่อย จำกัด (มหาชน)',
         
        },
        {
            bankCode: '032', // ดอยซ์แบงก์ เอจี DBAG
            shortCode: 'DBAG',
            bankNameEn: 'DEUTSCHE BANK AG',
            bankNameTh: 'ธนาคารดอยซ์แบงก์ เอจี',
         
        },
        {
            bankCode: '052', // ธนาคารแห่งประเทศจีน (ไทย) BOC
            shortCode: 'BOC',
            bankNameEn: 'Bank of China (Thai) Public Company Limited (BOC)',
            bankNameTh: 'ธนาคารแห่งประเทศจีน (ไทย) จำกัด (มหาชน)',
           
        },
        {
            bankCode: '079', // เอเอ็นแซด ANZ
            shortCode: 'ANZ',
            bankNameEn: 'ANZ Bank (Thai) Public Company Limited',
            bankNameTh: 'ธนาคารเอเอ็นแซด (ไทย) จำกัด (มหาชน)',
         
        },
        {
            bankCode: '029', // อินเดียนโอเวอร์ซีร์ IOBA
            shortCode: 'IOBA',
            bankNameEn: 'INDIAN OVERSEAS BANK',
            bankNameTh: 'ธนาคารอินเดียนโอเวอร์ซีร์',
           
        },
        {
            bankCode: '045', // บีเอ็นพี พารีบาส์ BNP
            shortCode: 'BNP',
            bankNameEn: 'BNP Paribas Bank',
            bankNameTh: 'ธนาคารบีเอ็นพี พารีบาส์',
        }
    ];
    const bank = bankList.find((bank) => bank.shortCode === shortCode.toUpperCase());
    //console.log(bank);
    return bank ? bank.bankCode : null;
}

  async getRequest(url, additionalHeaders = {}) {
    this.cookies = await this.cookieJar.getCookieString(this.BASEURL);
    const headers = {
      Host: "www.krungsribizonline.com",
      Origin: "https://www.krungsribizonline.com",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.112 Safari/537.36",
      Cookie: this.cookies,
      ...additionalHeaders, // Merge additional headers with default headers
    };

    return new Promise((resolve, reject) => {
      request.get(
        url,
        { headers, jar: this.cookieJar },
        (error, response, body) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  async postRequest(url, payload, additionalHeaders = {}) {
    try {
      // Get cookies from the cookie jar
      this.cookies = await this.cookieJar.getCookieString(this.BASEURL);

      // Set default headers
      const defaultHeaders = {
        Host: "www.krungsribizonline.com",
        Origin: "https://www.krungsribizonline.com",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.112 Safari/537.36",
        Cookie: this.cookies,
      };

      // Merge additional headers with default headers
      const headers = { ...defaultHeaders, ...additionalHeaders };

      // Check if payload is JSON or form data
      if (headers["Content-Type"].includes("application/json")) {
        // Return a promise to perform the post request with JSON payload
        return new Promise((resolve, reject) => {
          request.post(
            { url, json: payload, headers, jar: this.cookieJar },
            (error, response, body) => {
              if (error) {
                reject(error);
              } else {
                resolve(response);
              }
            }
          );
        });
      } else if (
        headers["Content-Type"].includes("application/x-www-form-urlencoded")
      ) {
        // Return a promise to perform the post request with form data payload
        return new Promise((resolve, reject) => {
          request.post(
            { url, form: payload, headers, jar: this.cookieJar },
            (error, response, body) => {
              if (error) {
                reject(error);
              } else {
                resolve(response);
              }
            }
          );
        });
      } else {
        // Unsupported content type
        throw new Error("Unsupported content type");
      }
    } catch (error) {
      // Handle errors
      throw new Error("Error occurred during POST request: " + error.message);
    }
  }
}
module.exports = KrungsriBizOnlineModel;