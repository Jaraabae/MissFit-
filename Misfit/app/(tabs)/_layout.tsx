import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text,SafeAreaView, } from 'react-native';

// Icon packs
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Entypo from 'react-native-vector-icons/Entypo';

const IconPacks: any = {
    AntDesign,
    MaterialIcons,
    Feather,
    Ionicons,
    FontAwesome,
    MaterialCommunityIcons,
    Entypo
};

// Reusable dynamic tab icon component
const TabIcon = ({ focused, iconType, iconName, title }: any) => {
    const IconComponent = IconPacks[iconType];

    if (!IconComponent) {
        console.warn(`Icon type "${iconType}" not found.`);
        return null;
    }

    return (
        <SafeAreaView style={styles.bg}>
            <IconComponent
                name={iconName}
                size={28}
                color={focused ? "#000" : "#666"}
            />
            <Text style={styles.label}>{title}</Text>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    bg: {
        alignItems: "center",
        justifyContent: "center",
        minWidth: 120,
        width: "100%",
        paddingBottom: 5
    },
    label: {
        fontSize: 12,
        fontWeight: 100,
        color: "black",
        marginTop: 2,
    },
});

export default function _layout() {
    return (
        <Tabs
            screenOptions={{
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: 'white',
                    width: "100%",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 80,
                    elevation: 0,
                    shadowColor: 'transparent',
                    padding: 2,
                }
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} iconType="MaterialIcons" iconName="home" title="Hub " />
                    ),
                }}
            />
            <Tabs.Screen
                name="fit"
                options={{
                    title: "Fit",
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} iconType="MaterialIcons" iconName="camera" title="FitCheck " />
                    ),
                }}
            />
            <Tabs.Screen
                name="catalog"
                options={{
                    title: "Shop",
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} iconType="MaterialIcons" iconName="shopping-bag" title="Boutique " />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} iconType="MaterialIcons" iconName="person" title="My Space" />
                    ),
                }}
            />
        </Tabs>
    );
}

