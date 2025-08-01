import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SendMailDto } from './dto/mail.dto';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('GMAIL_USER'),
        pass: this.configService.get<string>('GMAIL_APP_PASSWORD'),
      },
    });
  }

  async sendMail(sendMailDto: SendMailDto): Promise<void> {
    try {
      const { to, subject, html, text } = sendMailDto;

      const mailOptions = {
        from: this.configService.get<string>('GMAIL_USER'),
        to,
        subject,
        html,
        text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${to}: ${result.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${sendMailDto.to}:`, error);
      throw new Error('Failed to send email');
    }
  }

  async sendSurveyInvitation(
    to: string,
    surveyUuid: string,
    surveyTitle: string,
    invitationLink: string,
    surveyDescription?: string,
  ): Promise<void> {
    const subject = `[ZK Survey] 설문 참여 초대: ${surveyTitle}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #2c3e50; margin: 0;">ZK Survey</h1>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #34495e; margin-bottom: 20px;">설문 참여 초대</h2>
          
          <div style="background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #2c3e50; margin-top: 0;">${surveyTitle}</h3>
            ${surveyDescription ? `<p style="color: #7f8c8d; margin-bottom: 0;">${surveyDescription}</p>` : ''}
          </div>
          
          <p style="color: #34495e; line-height: 1.6;">
            안녕하세요!<br>
            설문에 참여해 주시기 바랍니다. 아래 링크를 클릭하여 설문에 참여하실 수 있습니다.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" 
               style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              설문 참여하기
            </a>
          </div>
          
          <div style="background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <p style="color: #2c3e50; margin-top: 0; text-align: center;">uuid</p>
            <h3 style="color: #2c3e50; margin-top: 0; text-align: center;">${surveyUuid}</h3>
          </div>
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-top: 30px;">
            <h4 style="color: #856404; margin-top: 0;">📋 참여 안내</h4>
            <ul style="color: #856404; margin-bottom: 0;">
              <li>설문 참여 시 랜덤으로 생성한 uuid와 함께 아래 링크에서 설문에 참여할 수 있습니다.</li>
              <li>설문은 한 번만 참여할 수 있으며, 참여 후 수정이 가능합니다.</li>
            </ul>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
            <p style="color: #7f8c8d; font-size: 14px; margin: 0;">
              본 메일은 ZK Survey 시스템에서 자동으로 발송되었습니다.<br>
              문의사항이 있으시면 설문 작성자에게 연락해 주세요.
            </p>
          </div>
        </div>
      </div>
    `;

    const text = `
ZK Survey - 설문 참여 초대

설문 제목: ${surveyTitle}
${surveyDescription ? `설문 설명: ${surveyDescription}` : ''}

안녕하세요!
설문에 참여해 주시기 바랍니다.

참여 링크: ${invitationLink}

📋 참여 안내:
- 설문 참여 시 비밀번호가 필요합니다.
- 비밀번호는 설문 작성자가 별도로 안내해 드릴 예정입니다.
- 설문은 한 번만 참여할 수 있으며, 참여 후 수정이 가능합니다.

본 메일은 ZK Survey 시스템에서 자동으로 발송되었습니다.
문의사항이 있으시면 설문 작성자에게 연락해 주세요.
    `;

    await this.sendMail({
      to,
      subject,
      html,
      text,
    });
  }

  async sendSurveyCompletionThankYou(
    to: string,
    surveyTitle: string,
    surveyDescription: string,
    surveyUuid: string,
    resultLink: string,
  ): Promise<void> {
    const subject = `[ZK Survey] 설문 참여 완료: ${surveyTitle}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #2c3e50; margin: 0;">ZK Survey</h1>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #34495e; margin-bottom: 20px;">설문 참여 완료</h2>
          
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #155724; margin-top: 0;">✅ 설문 참여가 완료되었습니다!</h3>
            <h4 style="color: #2c3e50; margin-bottom: 0;">${surveyTitle}</h4>
            ${surveyDescription ? `<p style="color: #7f8c8d; margin-bottom: 0;">${surveyDescription}</p>` : ''}
          </div>
          
          <p style="color: #34495e; line-height: 1.6;">
            안녕하세요!<br>
            설문에 참여해 주셔서 진심으로 감사합니다.<br>
            귀하의 소중한 의견이 설문 작성자에게 큰 도움이 될 것입니다.
          </p>
          
          <div style="background-color: #e3f2fd; border: 1px solid #bbdefb; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h4 style="color: #1976d2; margin-top: 0;">📊 내 응답 확인하기</h4>
            <p style="color: #1976d2; margin-bottom: 15px;">
              설문 참여 시 사용한 uuid와 비밀번호를 입력하여 아래 링크에서 본인의 응답을 확인할 수 있습니다.
            </p>
            <div style="text-align: center;">
              <div style="background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <p style="color: #2c3e50; margin-top: 0; text-align: center;">uuid</p>
                <h3 style="color: #2c3e50; margin-top: 0; text-align: center;">${surveyUuid}</h3>
              </div>
              <a href="${resultLink}" 
                 style="background-color: #2196f3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                내 응답 확인하기
              </a>
            </div>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-top: 30px;">
            <h4 style="color: #856404; margin-top: 0;">💡 참여 후 안내</h4>
            <ul style="color: #856404; margin-bottom: 0;">
              <li>응답 확인 시 설문 참여 시 사용한 비밀번호가 필요합니다.</li>
              <li>응답 수정이 필요한 경우 설문 참여 링크를 통해 수정할 수 있습니다.</li>
              <li>설문 결과는 설문 작성자가 공개할 때까지 확인할 수 없습니다.</li>
            </ul>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
            <p style="color: #7f8c8d; font-size: 14px; margin: 0;">
              본 메일은 ZK Survey 시스템에서 자동으로 발송되었습니다.<br>
              문의사항이 있으시면 설문 작성자에게 연락해 주세요.
            </p>
          </div>
        </div>
      </div>
    `;

    const text = `
ZK Survey - 설문 참여 완료

설문 제목: ${surveyTitle}
${surveyDescription ? `설문 설명: ${surveyDescription}` : ''}

안녕하세요!
설문에 참여해 주셔서 진심으로 감사합니다.
귀하의 소중한 의견이 설문 작성자에게 큰 도움이 될 것입니다.

📊 내 응답 확인하기
설문 참여 시 사용한 uuid와 비밀번호를 입력하여 아래 링크에서 본인의 응답을 확인할 수 있습니다.

uuid: ${surveyUuid}
응답 확인 링크: ${resultLink}

💡 참여 후 안내:
- 응답 확인 시 설문 참여 시 사용한 비밀번호가 필요합니다.
- 응답 수정이 필요한 경우 설문 참여 링크를 통해 수정할 수 있습니다.
- 설문 결과는 설문 작성자가 공개할 때까지 확인할 수 없습니다.

본 메일은 ZK Survey 시스템에서 자동으로 발송되었습니다.
문의사항이 있으시면 설문 작성자에게 연락해 주세요.
    `;

    await this.sendMail({
      to,
      subject,
      html,
      text,
    });
  }
}
