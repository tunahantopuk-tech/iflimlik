import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '../theme';

const PrivacyPolicyScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gizlilik Politikası</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.lastUpdated}>Son Güncelleme: 25 Şubat 2026</Text>

          <Text style={styles.sectionTitle}>1. Giriş</Text>
          <Text style={styles.paragraph}>
            iFilm olarak gizliliğinize saygı duyuyor ve kişisel verilerinizi korumayı taahhüt ediyoruz. Bu Gizlilik Politikası, mobil uygulamamızı kullanırken topladığımız bilgileri, bu bilgileri nasıl kullandığımızı ve haklarınızı açıklamaktadır.
          </Text>

          <Text style={styles.sectionTitle}>2. Toplanan Veriler</Text>
          <Text style={styles.paragraph}>
            iFilm uygulamasını kullanırken aşağıdaki verileri topluyoruz:
          </Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Hesap Bilgileri:</Text> Email adresi, kullanıcı adı</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>İçerik Tercihleri:</Text> İzlediğiniz filmler/diziler, favorileriniz, izleme listeniz</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>iFi Sohbet Geçmişi:</Text> Yapay zeka asistanımız iFi ile yaptığınız konuşmalar</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Ruh Hali Tercihleri:</Text> Uygulama içindeki ruh hali seçimleriniz</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Kullanım Verileri:</Text> Uygulama kullanım istatistikleri, hata raporları</Text>

          <Text style={styles.sectionTitle}>3. Verilerin Kullanım Amacı</Text>
          <Text style={styles.paragraph}>
            Toplanan veriler aşağıdaki amaçlarla kullanılmaktadır:
          </Text>
          <Text style={styles.bulletPoint}>• Kişiselleştirilmiş film ve dizi önerileri sunmak</Text>
          <Text style={styles.bulletPoint}>• iFi yapay zeka asistanı ile daha iyi etkileşim sağlamak</Text>
          <Text style={styles.bulletPoint}>• Kullanıcı deneyimini geliştirmek</Text>
          <Text style={styles.bulletPoint}>• Hesap güvenliğinizi sağlamak</Text>
          <Text style={styles.bulletPoint}>• Teknik destek sunmak</Text>
          <Text style={styles.bulletPoint}>• Uygulama performansını iyileştirmek</Text>

          <Text style={styles.sectionTitle}>4. Veri Saklama ve Güvenlik</Text>
          <Text style={styles.paragraph}>
            Verileriniz güvenli bulut sunucularda (Firebase Firestore) saklanmaktadır. Tüm veriler şifrelenmiş bağlantılar (HTTPS) üzerinden iletilir ve endüstri standardı güvenlik önlemleriyle korunmaktadır.
          </Text>
          <Text style={styles.paragraph}>
            Şifreleriniz bcrypt algoritması ile hashlenmiş olarak saklanır ve hiçbir zaman düz metin olarak tutulmaz.
          </Text>

          <Text style={styles.sectionTitle}>5. Üçüncü Taraf Hizmetleri</Text>
          <Text style={styles.paragraph}>
            iFilm uygulaması aşağıdaki üçüncü taraf hizmetlerini kullanmaktadır:
          </Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>TMDB (The Movie Database):</Text> Film ve dizi bilgileri, posterler, açıklamalar</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Firebase:</Text> Kullanıcı kimlik doğrulama ve veri saklama</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Abacus AI:</Text> Yapay zeka destekli öneri sistemi</Text>
          <Text style={styles.paragraph}>
            Bu hizmetlerin kendi gizlilik politikaları vardır ve bu politikalara uymaktan sorumludurlar.
          </Text>

          <Text style={styles.sectionTitle}>6. Veri Paylaşımı</Text>
          <Text style={styles.paragraph}>
            Kişisel verilerinizi üçüncü taraflarla <Text style={styles.bold}>satmıyoruz, kiralamıyoruz veya paylaşmıyoruz</Text>. Verileriniz yalnızca yukarıda belirtilen hizmet sağlayıcılar ile uygulama işlevselliği için gerekli olduğu ölçüde paylaşılır.
          </Text>

          <Text style={styles.sectionTitle}>7. Kullanıcı Hakları</Text>
          <Text style={styles.paragraph}>
            KVKK ve GDPR kapsamında aşağıdaki haklara sahipsiniz:
          </Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Erişim Hakkı:</Text> Kişisel verilerinize erişim talep edebilirsiniz</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Düzeltme Hakkı:</Text> Yanlış veya eksik verilerinizi düzeltebilirsiniz</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Silme Hakkı:</Text> Hesabınızı ve tüm verilerinizi silebilirsiniz</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Veri Taşınabilirliği:</Text> Verilerinizi indirme talebinde bulunabilirsiniz</Text>
          <Text style={styles.bulletPoint}>• <Text style={styles.bold}>İtiraz Hakkı:</Text> Veri işleme faaliyetlerine itiraz edebilirsiniz</Text>

          <Text style={styles.sectionTitle}>8. Çocukların Gizliliği</Text>
          <Text style={styles.paragraph}>
            Uygulamamız 13 yaş altı çocuklara yönelik değildir. 13 yaş altı kullanıcılardan bilerek kişisel veri toplamıyoruz. Eğer bir ebeveyn veya vasiyseniz ve çocuğunuzun bize kişisel bilgi verdiğini fark ederseniz, lütfen bizimle iletişime geçin.
          </Text>

          <Text style={styles.sectionTitle}>9. Veri Saklama Süresi</Text>
          <Text style={styles.paragraph}>
            Kişisel verileriniz, hesabınızı silene kadar saklanır. Hesap silme işleminden sonra tüm kişisel verileriniz 30 gün içinde kalıcı olarak silinir.
          </Text>

          <Text style={styles.sectionTitle}>10. Çerezler ve İzleme Teknolojileri</Text>
          <Text style={styles.paragraph}>
            Mobil uygulamamız, tercihlerinizi hatırlamak ve kullanıcı deneyimini iyileştirmek için yerel depolama (AsyncStorage) kullanır. Bu veriler cihazınızda saklanır ve yalnızca uygulama tarafından erişilebilir.
          </Text>

          <Text style={styles.sectionTitle}>11. Gizlilik Politikası Değişiklikleri</Text>
          <Text style={styles.paragraph}>
            Bu Gizlilik Politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikler olduğunda, uygulama içi bildirim veya email yoluyla sizi bilgilendireceğiz. Değişiklikler bu sayfada yayınlandığı anda yürürlüğe girer.
          </Text>

          <Text style={styles.sectionTitle}>12. İletişim</Text>
          <Text style={styles.paragraph}>
            Gizlilik politikamız hakkında sorularınız veya talepleriniz varsa bizimle iletişime geçebilirsiniz:
          </Text>
          <Text style={styles.bulletPoint}>• Email: privacy@ifilm.com</Text>
          <Text style={styles.bulletPoint}>• Uygulama içi destek: Profil → Ayarlar → İletişim</Text>

          <Text style={styles.sectionTitle}>13. Yasal Uyum</Text>
          <Text style={styles.paragraph}>
            iFilm, Türkiye Cumhuriyeti Kişisel Verilerin Korunması Kanunu (KVKK) ve Avrupa Birliği Genel Veri Koruma Yönetmeliği (GDPR) gerekliliklerine uymaktadır.
          </Text>

          <Text style={styles.footer}>
            Bu Gizlilik Politikası, iFilm uygulamasını kullanarak kabul etmiş sayılırsınız.
          </Text>

          {/* Company Logo & Contact */}
          <View style={styles.companySection}>
            <Image
              source={require('../../assets/company-logo.png')}
              style={styles.companyLogo}
              resizeMode="contain"
            />
            <TouchableOpacity
              onPress={() => Linking.openURL('mailto:ifilmlikiletisim@gmail.com')}
              activeOpacity={0.7}
            >
              <Text style={styles.contactEmail}>
                İletişim: ifilmlikiletisim@gmail.com
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#292929',
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.white,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  lastUpdated: {
    fontSize: 12,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.xl,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  sectionTitle: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  paragraph: {
    fontSize: 13,
    color: colors.white,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  bulletPoint: {
    fontSize: 13,
    color: colors.white,
    lineHeight: 20,
    marginBottom: spacing.xs,
    marginLeft: spacing.md,
  },
  bold: {
    fontWeight: '700',
    color: colors.white,
  },
  footer: {
    fontSize: 11,
    color: colors.white,
    textAlign: 'center',
    marginTop: spacing.xl,
    fontStyle: 'italic',
  },
  companySection: {
    alignItems: 'center',
    marginTop: spacing.xl * 2,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  companyLogo: {
    width: 120,
    height: 120,
    marginBottom: spacing.lg,
  },
  contactEmail: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default PrivacyPolicyScreen;
