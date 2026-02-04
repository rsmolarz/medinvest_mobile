en',
      alignItems: 'center',
      marginBottom: 15,
  },
    summaryLabel: {
      fontSize: 12,
            color: '#999',
            marginBottom: 4,
        },
          summaryValue: {
            fontSize: 16,
                  fontWeight: '600',
                  color: '#000',
              },
                summaryDivider: {
                      width: 1,
                            height: 40,
                            backgroundColor: '#eee',
                        },
    percentageRow: {
          borderTopWidth: 1,
                borderTopColor: '#eee',
                paddingTop: 15,
            },
              percentageText: {
                fontSize: 18,
                      fontWeight: 'bold',
                  },
        gain: {
              color: '#34C759',
                },
        loss: {
              color: '#FF3B30',
                },
        chartCard: {
              backgroundColor: '#fff',
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 20,
                    elevation: 3,
                },
                  chartTitle: {
                    fontSize: 16,
                          fontWeight: '600',
                          marginBottom: 15,
                      },
                        chart: {
                          borderRadius: 8,
                            },
                  actionButtons: {
                        flexDirection: 'row',
                              gap: 10,
                              marginBottom: 30,
                          },
                            actionButton: {
                              flex: 1,
                                    paddingVertical: 12,
                                    borderRadius: 8,
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: '#007AFF',
                                },
                      primaryButton: {
                            backgroundColor: '#007AFF',
                              },
                      actionButtonText: {
                            fontSize: 14,
                                  fontWeight: '600',
                                  color: '#fff',
                              },
                      secondaryButtonText: {
                            color: '#007AFF',
                              },
                      sectionTitle: {
                            fontSize: 18,
                                  fontWeight: '600',
                                  marginBottom: 15,
                                  color: '#000',
                              },
                      investmentsList: {
                            marginBottom: 20,
                              },
                      investmentCard: {
                            backgroundColor: '#fff',
                                  borderRadius: 10,
                                  padding: 15,
                                  marginBottom: 12,
                                  elevation: 2,
                              },
                                investmentHeader: {
                                  flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: 10,
                                    },
                                      investmentName: {
                                        fontSize: 16,
                                              fontWeight: '600',
                                              color: '#000',
                                          },
                                investmentTicker: {
                                      fontSize: 12,
                                            color: '#999',
                                            marginTop: 2,
                                        },
                                          investmentValue: {
                                            alignItems: 'flex-end',
                                              },
                                    investmentPrice: {
                                          fontSize: 14,
                                                fontWeight: '600',
                                                color: '#000',
                                            },
                                    gainLoss: {
                                          fontSize: 12,
                                                fontWeight: '600',
                                                marginTop: 4,
                                            },
                                              investmentDetails: {
                                                flexDirection: 'row',
                                                      justifyContent: 'space-between',
                                                      borderTopWidth: 1,
                                                      borderTopColor: '#eee',
                                                      paddingTop: 10,
                                                  },
                                                    investmentQty: {
                                                      fontSize: 12,
                                                            color: '#666',
                                                        },
                                              investmentTotal: {
                                                    fontSize: 12,
                                                          fontWeight: '600',
                                                          color: '#000',
                                                      },
                                              errorText: {
                                                    fontSize: 16,
                                                          color: '#FF3B30',
                                                          marginBottom: 20,
                                                      },
                                                        retryButton: {
                                                          backgroundColor: '#007AFF',
                                                                paddingVertical: 10,
                                                                paddingHorizontal: 20,
                                                                borderRadius: 8,
                                                            },
                                                  retryButtonText: {
                                                        color: '#fff',
                                                              fontWeight: '600',
                                                          },
                                              });import React, { useState } from 'react';
                                            import {
                                                View,
                                                Text,
                                                ScrollView,
                                                StyleSheet,
                                                TextInput,
                                                TouchableOpacity,
                                                ActivityIndicator,
                                                Alert,
                                                KeyboardAvoidingView,
                                                Platform,
                                            } from 'react-native';
                                            import { apiClient } from '../../services/api';

                                            export const AddInvestmentScreen: React.FC<{ navigation: any; route: any }> = ({
                                                navigation,
                                                route,
                                            }) => {
                                                const isEditing = route.params?.investmentId ? true : false;
                                                const [name, setName] = useState(route.params?.name || '');
                                                const [ticker, setTicker] = useState(route.params?.ticker || '');
                                                const [quantity, setQuantity] = useState(route.params?.quantity?.toString() || '');
                                                const [purchasePrice, setPurchasePrice] = useState(route.params?.purchasePrice?.toString() || '');
                                                const [currentPrice, setCurrentPrice] = useState(route.params?.currentPrice?.toString() || '');
                                                const [loading, setLoading] = useState(false);
                                                const [errors, setErrors] = useState<Record<string, string>>({});

                                                const validateForm = () => {
                                                      const newErrors: Record<string, string> = {};
                                                      if (!name.trim()) newErrors.name = 'Investment name is required';
                                                      if (!ticker.trim()) newErrors.ticker = 'Ticker symbol is required';
                                                      if (!quantity || isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0)
                                                              newErrors.quantity = 'Valid quantity required';
                                                      if (!purchasePrice || isNaN(parseFloat(purchasePrice)) || parseFloat(purchasePrice) < 0)
                                                              newErrors.purchasePrice = 'Valid purchase price required';
                                                      if (!currentPrice || isNaN(parseFloat(currentPrice)) || parseFloat(currentPrice) < 0)
                                                              newErrors.currentPrice = 'Valid current price required';
                                                      setErrors(newErrors);
                                                      return Object.keys(newErrors).length === 0;
                                                };

                                                const handleSave = async () => {
                                                      if (!validateForm()) return;

                                                      try {
                                                              setLoading(true);
                                                              const investmentData = {
                                                                        name,
                                                                        ticker,
                                                                        quantity: parseFloat(quantity),
                                                                        purchasePrice: parseFloat(purchasePrice),
                                                                        currentPrice: parseFloat(currentPrice),
                                                              };

                                                              if (isEditing) {
                                                                        await apiClient.updateInvestment(route.params.investmentId, investmentData);
                                                                        Alert.alert('Success', 'Investment updated successfully');
                                                                      } else {
                                                                        await apiClient.addInvestment(investmentData);
                                                                        Alert.alert('Success', 'Investment added successfully');
                                                              }
                                                              navigation.goBack();
                                                      } catch (error) {
                                                              Alert.alert('Error', 'Failed to save investment');
                                                      } finally {
                                                              setLoading(false);
                                                      }
                                                };

                                                return (
                                                      <KeyboardAvoidingView
                                                              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                                                              le={stylesntainer}
                                                            >
                                                            <ScrollVis.title}>{isEditing ? 'Edit Invesle={styles.scroiew} contentContainerStyle={styles.content}>
                                                                    <Texttment' : 'Add New Investment'}</KeyboardAvoidingView>Text>
                                                  
                                                          <VieVityles.label}>Investment Nam</VieVityles.label>{styles.formGroup}>
                                                                      <Text ls</VieView>styles.fe *</Text>
                                                          <TextInput
                                                           placeholder="e.g., Apple Inc."{[styles.input, errors.name &es.inputErr"
                                                            value={name}
                                                            onChangeText={setName}
                                                            editable={!loading}
                                              </View>
                                              
                                              {/* Ticker Symbol *icker Symbol *</Text>
                                                          <TextInputorPL"
                                                            value={ticker}
                                                            onChangeText={(text) => setTicker(text.toUpperCase())}
                                                    editable={!loading}
                                                maxLength={5}
                                                              />
                                                  {errors.ticker && <Tex          </View>
                                                  
                                      {/* Quantity */}
                                                <Vi{styles.label}>Quantity *</Vi>Text>
                                                              </Vi>{styles.formGroup}>
                                                            <Text<TextInput
                                     nputErro placeholder="e.g., 10"
                                                                            value={quantity}
                                                                            onChangeText={setQuantity}
                                                                            keyboardType="decimal-pad"
                                                                            editable={!loading}
                                                                          />
                                      {errors.quantity && <Tet>}
                                      </Tet>View>
                                        
                                        {/* Purchase Price */}
                                                    <TextInput
                                      nputEr         placeholder="e.g., 150.25"
                                                      value={purchasePrice}
                                                                      onChangeText={setPurchasePrice}
                                                                                      keyboardType="decimal-pad"
                                                                                                      editable={!loading}
                                                                                                                    />
                                      {errors.purchasePrice && <Terice}</Text>}
                                        </View>
                                      
                                       {/* Current Price */}
                                               ent Price (per share) *</Text>
                                                             <TextInput
                                                                         r]}50"
                                                      value={currentPrice}
                                                      onChangeText={setCurrentPrice}
                                                      keyboardType="decimal-pad"
                                                      editable={!loading}
                                              />
                                  {errors.currentPrice && <TerrentPrice}</Text>}
                                    </View>
                                    
                                   {/* Info Box */}
                                   {quantity && purchasePrice && currentPrice && (
                                                 <Vie <T</Text>
                                                   <T   ${(parseFloat(quantity) * parseFloat(purchasePrice)).toFixed(2)}
                                    </Text>
                                                    <Texlue:</Text>
                                                    <Text
                                                 parseFloat(curr)
                                                        .infoValentPrice) >= parseFloat(purchasePrice)
                                                                 ]}
                                                 >
                                                            .gain
                                                               ${(parseFloat(quantity) * parseFloat(currentPrice)).toFixed(2)}
                                                 </>Text>
                                                   </View>
                                                             )}
                                  </View>
                                                   
                                   {/* Buttons */}
                                           <V         <TouchableOpacity
                                                           onPress={() => nav={[styles.buttonigation.goBack()}
                                                                         disabled={loading}
                                              >
                                                <Tex</TouchableOpacity>
                                              <TouchableOpacity
                                              onPress={handleSa          disabled={loading}
                                                                 >
                                                       {loading ? (
                                                                       <ActivityIndicator color="#fff" />
                                                                     ) : (
                                                                       <Teing ? 'Update' : 'Add'} Investment
                                                                        </Text>
                                                                                      )}
                                                                          </TouchableOpacity>
                                                       </View>
                                                       </ScrollView>
                                                       </KeyboardAvoidingView>
                                                         );
                                };
                              
                              consts = StyleShe,
                                    backgroundColor: '#f5f5f5',
                                },
                                  scrollView: {
                                        flex: 1,
                                          },
                                            content: {
                                                  padding: 20,
                                                        paddingBottom: 40,
                                                    },
                                                      title: {
                                                        fontSize: 24,
                                                              fontWeight: 'bold',
                                                              marginBottom: 30,
                                                              color: '#000',
                                                          },
                                                            form: {
                                                                  marginBottom: 30,
                                                                    },
                                                                      formGroup: {
                                                                            marginBottom: 20,
                                                                              },
                                                                                label: {
                                                                                      fontSize: 14,
                                                                                            fontWeight: '600',
                                                                                            marginBottom: 8,
                                                                                            color: '#333',
                                                                                        },
                                                                                          input: {
                                                                                                backgroundColor: '#fff',
                                                                                                      borderWidth: 1,
                                                                                                      borderColor: '#ddd',
                                                                                                      borderRadius: 8,
                                                                                                      paddingHorizontal: 15,
                                                                                                      paddingVertical: 12,
                                                                                                      fontSize: 16,
                                                                                                      color: '#000',
                                                                                                  },
                                                                                                    inputError: {
                                                                                                          borderColor: '#FF3B30',
                                                                                                                backgroundColor: '#fff5f5',
                                                                                                            },
                                                                                                              errorText: {
                                                                                                                    color: '#FF3B30',
                                                                                                                          fontSize: 12,
                                                                                                                          marginTop: 5,
                                                                                                                      },
                                                                                                                        infoBox: {
                                                                                                                          backgroundColor: '#f0f8ff',
                                                                                                                                borderRadius: 10,
                                                                                                                                padding: 15,
                                                                                                                                borderLeftWidth: 4,
                                                                                                                                borderLeftColor: '#007AFF',
                                                                                                                            },
                                                                                                                              infoLabel: {
                                                                                                                                    fontSize: 12,
                                                                                                                                          color: '#666',
                                                                                                                                          marginBottom: 4,
                                                                                                                                          marginTop: 8,
                                                                                                                                      },
                                                                                                                                        infoValue: {
                                                                                                                                          fontSize: 18,
                                                                                                                                                fontWeight: 'bold',
                                                                                                                                                color: '#000',
                                                                                                                                            },
                                                                                                                                              gain: {
                                                                                                                                                    color: '#34C759',
                                                                                                                                                      },
                                                                                                                                                        loss: {
                                                                                                                                                              color: '#FF3B30',
                                                                                                                                                                },
                                                                                                                                                                  buttonGroup: {
                                                                                                                                                                        flexDirection: 'row',
                                                                                                                                                                              gap: 12,
                                                                                                                                                                          },
                                                                                                                                                                            button: {
                                                                                                                                                                              flex: 1,
                                                                                                                                                                                    paddingVertical: 14,
                                                                                                                                                                                    borderRadius: 8,
                                                                                                                                                                                    alignItems: 'center',
                                                                                                                                                                                    justifyContent: 'center',
                                                                                                                                                                                },
                                                                                                                                                                                  cancelButton: {
                                                                                                                                                                                        backgroundColor: '#f0f0f0',
                                                                                                                                                                                              borderWidth: 1,
                                                                                                                                                                                              borderColor: '#ddd',
                                                                                                                                                                                          },
                                                                                                                                                                      cancelButtonText: {
                                                                                                                                                                            fontSize: 16,
                                                                                                                                                                                  fontWeight: '600',
                                                                                                                                                                                  color: '#333',
                                                                                                                                                                              },
                                                                                                                                                                                saveButton: {
                                                                                                                                                                                      backgroundColor: '#007AFF',
                                                                                                                                                                                        },
                                                                                                                                                                                          saveButtonText: {
                                                                                                                                                                                                fontSize: 16,
                                                                                                                                                                                                      fontWeight: '600',
                                                                                                                                                                                                      color: '#fff',
                                                                                                                                                                                                  },
                                                                                                                                                                    });create({
                                  container: {
                                        flex: 1{styles.saveButtonText}>
                                                         {isEdit}
                                                                     )
                                                       )}
                                                  ={[styles.button, .saveButton]}
                                              styles.cancelButtonText}>Cancel</Text>Text>
                                              </Text>cancelButton]}
                                                   ={StyleSheet.buttonGroup}>
                                            </View>loss,
                                                                
                                        ]}styles.infoLabel}>Current Va</Text>={styles.infoValue}>
                                                  ={styles.infoLabel}>Total Invested:styles.infoBox}>
                                                              </View>lstyles.errorText}>{errors.cupeholder="e.g., 175."={[styles.input, errors.currentPrice && styles.inputErroVie{styles.label}>Curr</Vie>styles.formGroup}>
                                                             <Text </View>{styles.errorText}>{errors.purchaseP</Text>}]}
                                           styles.input, errors.purchasePrice && li]}<VieText sty{styllabel}>Purchase Price (per share) *</Text>.formGroup}>
                                                  </Tet>setyles.errorText}>{errors.quantity}</Tex}
                                               styles.input, errors.quantity &&s.i]}=</View>styles.errorText}>{errors.ticker}</Text>Text>}
                                                  </Text>placeholder="e.g., AA<View {styles.formGroup            ={[styles.input, errors.ticker &&s.inputErr]}                                                        <Text={styles.label}>T{errors.name && <Text={styles.errorText}>{errors.name}</Text>}
                                              "}
                                                }>
                                                            {/* Investment Name */}
                                                                    <</View>=yle</KeyboardAvoidingView>
                                                )
                                                      }
                                                      }
                                                                      }
                                                              }
                                                              }
                                                      }
                                                }
                                                }
                                            }
                                            })
                                            }
                                                  }
                                                        }
                                              }
                                              }
                                                    }
                                              }
                                    }
                                    }
                                          }
                                }
                                      }
                                }
                      }
                      }
                      }
                      }
                      }
                      }
                            }
                  }
                        }
                  }
        }
        }
        }
              }
    }
                }
          }
    }