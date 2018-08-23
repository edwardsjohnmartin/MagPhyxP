#ifndef __PHYSICS_H__
#define __PHYSICS_H__

#include <stdexcept>

#include <gsl/gsl_matrix.h>

#include "./vec.h"
#include "./Dipole.h"
#include "./Options.h"

class Physics {
 public:
  static double deg2rad(const double a) {
    return a * M_PI / 180.0;
  }

  static double rad2deg(const double a) {
    return a * 180.0 / M_PI;
  }

  // Rotates an angle until it's in the range [-180, 180].
  // a is in radians.
  static inline double normalizeAngle(double a) {
    while (a > M_PI) a -= 2*M_PI;
    while (a < -M_PI) a += 2*M_PI;
    return a;
  }

  //----------------------------------------
  // Equations 52-57
  //----------------------------------------
  // dxdt is an array of size 6 of the form
  //   [ dr_dt, dtheta_dt, dphi_dt, dpr_dt, dptheta_dt, dpphi_dt ]
  static void get_derivatives(const Dipole& d, double dxdt[]) {
    const double r = d.get_r();
    const double theta = d.get_theta();
    const double phi = d.get_phi();
    const double pr = d.get_pr();
    const double ptheta = d.get_ptheta();
    const double pphi = d.get_pphi();

    // Pre-computations
    const double r2 = r * r;
    const double r3 = r2 * r;
    const double r4 = r3 * r;
    const double r5 = r4 * r;
    const double cos_phi = cos(phi);
    const double sin_phi = sin(phi);
    const double cos2 = cos(phi-2*theta);
    const double sin2 = sin(phi-2*theta);

    if (o.dynamics == Options::BOUNCING) {
      dxdt[0] = pr;
      dxdt[3] = ptheta * ptheta / r3 -
          (1/(4*r4)) * (cos_phi + 3*cos2);
    } else {
      dxdt[0] = 0;
      dxdt[3] = 0;
    }

    // This doesn't work yet. GSL does multiple intermediate steps and it's
    // possible that it hits exactly r=1 and stops instead of reflecting.
    // if (r == 1 && pr <= 0) {
    //   dxdt[0] = 0;
    //   dxdt[3] = 0;
    // } else {
    //   dxdt[0] = pr;
    //   dxdt[3] = ptheta * ptheta / r3 -
    //       (1/(4*r4)) * (cos_phi + 3*cos2);
    // }

    dxdt[1] = ptheta / r2;
    dxdt[2] = 10 * pphi;
    dxdt[4] = (1/(2*r3)) * sin2;
    dxdt[5] = -(1/(12*r3)) * (sin_phi + 3*sin2);
  }

  static void get_jacobian(const Dipole& d, double* dfdy) {
    const double r = d.get_r();
    const double theta = d.get_theta();
    const double phi = d.get_phi();
    const double pr = d.get_pr();
    const double ptheta = d.get_ptheta();
    const double pphi = d.get_pphi();

    // Pre-computations
    const double r2 = r * r;
    const double r3 = r2 * r;
    const double r4 = r3 * r;
    const double r5 = r4 * r;
    const double cos_phi = cos(phi);
    const double sin_phi = sin(phi);
    const double cos2 = cos(phi-2*theta);
    const double sin2 = sin(phi-2*theta);

    gsl_matrix_view dfdy_mat = gsl_matrix_view_array(dfdy, 6, 6);
    gsl_matrix* m = &dfdy_mat.matrix; 
    // dr'_dy
    gsl_matrix_set(m, 0, 0, 0);
    gsl_matrix_set(m, 0, 1, 0);
    gsl_matrix_set(m, 0, 2, 0);
    gsl_matrix_set(m, 0, 3, 1);
    gsl_matrix_set(m, 0, 4, 0);
    gsl_matrix_set(m, 0, 5, 0);
    // dtheta'_dy
    gsl_matrix_set(m, 1, 0, -2*ptheta/r3);
    gsl_matrix_set(m, 1, 1, 0);
    gsl_matrix_set(m, 1, 2, 0);
    gsl_matrix_set(m, 1, 3, 0);
    gsl_matrix_set(m, 1, 4, 1/r2);
    gsl_matrix_set(m, 1, 5, 0);
    // dphi'_dy
    gsl_matrix_set(m, 2, 0, 0);
    gsl_matrix_set(m, 2, 1, 0);
    gsl_matrix_set(m, 2, 2, 0);
    gsl_matrix_set(m, 2, 3, 0);
    gsl_matrix_set(m, 2, 4, 0);
    gsl_matrix_set(m, 2, 5, 10);
    // dpr'_dy
    gsl_matrix_set(m, 3, 0, -(3*ptheta*ptheta/r4)+(cos_phi+3*cos2)/r5);
    gsl_matrix_set(m, 3, 1, -(3/(2*r4))*sin2);
    gsl_matrix_set(m, 3, 2, (sin_phi+3*sin2)/(4*r4));
    gsl_matrix_set(m, 3, 3, 0);
    gsl_matrix_set(m, 3, 4, 2*ptheta/r3);
    gsl_matrix_set(m, 3, 5, 0);
    // dptheta'_dy
    gsl_matrix_set(m, 4, 0, -(3/(2*r4))*sin2);
    gsl_matrix_set(m, 4, 1, -cos2/r3);
    gsl_matrix_set(m, 4, 2, cos2/(2*r3));
    gsl_matrix_set(m, 4, 3, 0);
    gsl_matrix_set(m, 4, 4, 0);
    gsl_matrix_set(m, 4, 5, 0);
    // dpphi'_dy
    gsl_matrix_set(m, 5, 0, (sin_phi+3*sin2)/(4*r4));
    gsl_matrix_set(m, 5, 1, cos2/(2*r3));
    gsl_matrix_set(m, 5, 2, -(cos_phi+3*cos2)/(12*r3));
    gsl_matrix_set(m, 5, 3, 0);
    gsl_matrix_set(m, 5, 4, 0);
    gsl_matrix_set(m, 5, 5, 0);
  }

  static double B_dir(const Dipole& d) {
    return atan2(3*sin(2*d.get_theta()), 1+3*cos(2*d.get_theta()));
  }

  static double get_beta(const Dipole& d) {
    return d.get_phi() - B_dir(d);
  }

  // Force dipole d. Return value in the form
  // (r_hat, theta_hat).
  // Equation 59 of the paper.
  static double2 F(const Dipole& d) {
    const double r = d.get_r();
    const double theta = d.get_theta();
    const double phi = d.get_phi();

    const double r2 = r*r;
    const double cr = -1 / (4 * r2 * r2);
    const double ctheta = 1 / (2 * r2 * r2);

    return make_double2(cr*(cos(phi) + 3*cos(phi-2*theta)),
                        ctheta*sin(phi-2*theta));
  }

  // Torque on dipole d.
  // Equation 72 of the paper.
  static double T(const Dipole& d) {
    const double r = d.get_r();
    const double theta = d.get_theta();
    const double phi = d.get_phi();

    return (-1/(12*r*r*r)) * (sin(phi) + 3*sin(phi-2*theta));
  }

};

#endif
