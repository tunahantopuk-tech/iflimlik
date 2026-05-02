import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  focused?: boolean;
  size?: number;
}

const CompareIcon: React.FC<Props> = ({ focused = false, size = 28 }) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={focused ? ['#FF8C00', '#DC143C'] : ['#FF8C00', '#DC143C']}
        style={[styles.gradient, { width: size + 16, height: size + 16 }]}
      >
        <View style={styles.textContainer}>
          <Text style={[styles.text, { fontSize: size * 0.4 }]}>O</Text>
          <Text style={[styles.vs, { fontSize: size * 0.22 }]}>mu?</Text>
          <Text style={[styles.text, { fontSize: size * 0.4 }]}>Bu</Text>
          <Text style={[styles.vs, { fontSize: size * 0.22 }]}>mu?</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  textContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: 'white',
    fontWeight: '900',
    textAlign: 'center',
  },
  vs: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.8,
    marginVertical: -2,
  },
});

export default CompareIcon;
