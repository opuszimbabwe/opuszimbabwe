package zw.co.opuszim.inbox;
import android.app.Notification;
import android.os.Build;
import androidx.browser.trusted.TokenStore;
import androidx.browser.trusted.TrustedWebActivityService;
public final class InboxNotificationService extends TrustedWebActivityService {
 public TokenStore getTokenStore(){return new ProviderTokens(this);}
 @Override public boolean onNotifyNotificationWithChannel(String tag,int id,Notification notification,String channelName){
  if(Build.VERSION.SDK_INT>=26){android.app.NotificationChannel channel=new android.app.NotificationChannel("opus_customer_messages_channel_id","Customer messages",android.app.NotificationManager.IMPORTANCE_HIGH);channel.setDescription("New customer enquiries from the Opus Zimbabwe website");getSystemService(android.app.NotificationManager.class).createNotificationChannel(channel);}
  return super.onNotifyNotificationWithChannel(tag,id,notification,"Opus customer messages");
 }
 @Override public boolean onAreNotificationsEnabled(String channelName){return super.onAreNotificationsEnabled("Opus customer messages");}
}
